from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..dependencies import get_current_user, require_manager, require_manager_or_leader
from ..models.user import User, UserRole
from ..models.project import Project, ProjectMember, MemberRole, ProjectPriority
from ..models.notification import NotificationType
from ..models.task import TaskStatus
from ..schemas.project import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectSummary,
    AddMemberRequest, UpdateMemberRoleRequest, ProjectMemberResponse,
)
from ..schemas.hierarchy import ProjectHierarchy, StoryHierarchy, TaskHierarchy
from ..services.notification_service import notify_added_to_project, create_notification
from ..services.activity_service import log_activity

router = APIRouter(prefix="/projects", tags=["Projects"])


def _compute_progress(project: Project) -> dict:
    total = sum(len(s.tasks) for s in project.stories)
    done = sum(
        sum(1 for t in s.tasks if t.status == TaskStatus.DONE)
        for s in project.stories
    )
    progress = round((done / total * 100), 1) if total > 0 else 0.0
    return {
        "total_stories": len(project.stories),
        "total_tasks": total,
        "completed_tasks": done,
        "progress": progress,
    }


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    project = Project(
        name=payload.name,
        description=payload.description,
        status=payload.status,
        priority=payload.priority or ProjectPriority.MEDIUM,
        deadline=payload.deadline,
        created_by=current_user.id,
    )
    db.add(project)
    db.flush()

    # Add creator as OWNER member
    owner_membership = ProjectMember(
        project_id=project.id, user_id=current_user.id, role=MemberRole.OWNER
    )
    db.add(owner_membership)

    # Auto-add team leader if specified
    if payload.team_leader_id:
        leader_user = db.query(User).filter(User.id == payload.team_leader_id).first()
        if leader_user:
            leader_membership = ProjectMember(
                project_id=project.id,
                user_id=payload.team_leader_id,
                role=MemberRole.TEAM_LEADER,
            )
            db.add(leader_membership)

    db.commit()
    db.refresh(project)

    # Notify team leader (after commit so the project exists)
    if payload.team_leader_id:
        background_tasks.add_task(
            notify_added_to_project, db, payload.team_leader_id, project.name, project.id
        )

    background_tasks.add_task(
        log_activity, db, current_user.id, "created_project", "project",
        project.id, project.name, project.id,
    )

    stats = _compute_progress(project)
    resp = ProjectResponse.model_validate(project)
    resp.total_stories = stats["total_stories"]
    resp.total_tasks = stats["total_tasks"]
    resp.completed_tasks = stats["completed_tasks"]
    resp.progress = stats["progress"]
    return resp


@router.get("", response_model=List[ProjectSummary])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == UserRole.MANAGER:
        # Manager sees ALL projects in the system
        projects = (
            db.query(Project)
            .options(joinedload(Project.stories), joinedload(Project.members))
            .all()
        )
    else:
        # Other users see only projects they are members of
        memberships = (
            db.query(ProjectMember)
            .filter(ProjectMember.user_id == current_user.id)
            .all()
        )
        project_ids = [m.project_id for m in memberships]
        projects = (
            db.query(Project)
            .options(joinedload(Project.stories), joinedload(Project.members))
            .filter(Project.id.in_(project_ids))
            .all()
        )

    result = []
    for p in projects:
        stats = _compute_progress(p)
        result.append(
            ProjectSummary(
                id=p.id,
                name=p.name,
                description=p.description,
                status=p.status,
                created_at=p.created_at,
                total_stories=stats["total_stories"],
                total_tasks=stats["total_tasks"],
                completed_tasks=stats["completed_tasks"],
                progress=stats["progress"],
                member_count=len(p.members),
            )
        )
    return result


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .options(
            joinedload(Project.members).joinedload(ProjectMember.user),
            joinedload(Project.created_by_user),
            joinedload(Project.stories),
        )
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    _assert_member(project, current_user)

    stats = _compute_progress(project)
    resp = ProjectResponse.model_validate(project)
    resp.total_stories = stats["total_stories"]
    resp.total_tasks = stats["total_tasks"]
    resp.completed_tasks = stats["completed_tasks"]
    resp.progress = stats["progress"]
    return resp


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own projects")

    if payload.name is not None:
        project.name = payload.name
    if payload.description is not None:
        project.description = payload.description
    if payload.status is not None:
        project.status = payload.status
    if payload.priority is not None:
        project.priority = payload.priority
    if payload.deadline is not None:
        project.deadline = payload.deadline

    db.commit()
    db.refresh(project)
    stats = _compute_progress(project)
    resp = ProjectResponse.model_validate(project)
    resp.total_stories = stats["total_stories"]
    resp.total_tasks = stats["total_tasks"]
    resp.completed_tasks = stats["completed_tasks"]
    resp.progress = stats["progress"]
    return resp


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own projects")
    db.delete(project)
    db.commit()


# ── Member management ──────────────────────────────────────────────────────────

@router.post("/{project_id}/members", response_model=ProjectMemberResponse)
def add_member(
    project_id: int,
    payload: AddMemberRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_leader),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Team leaders can only add members to projects they belong to
    if current_user.role == UserRole.TEAM_LEADER:
        membership = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
        ).first()
        if not membership:
            raise HTTPException(status_code=403, detail="You are not a member of this project")

    user_to_add = db.query(User).filter(User.id == payload.user_id).first()
    if not user_to_add:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == payload.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = ProjectMember(
        project_id=project_id,
        user_id=payload.user_id,
        role=payload.role,
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    background_tasks.add_task(
        notify_added_to_project, db, payload.user_id, project.name, project_id
    )

    return member


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_leader),
):
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")
    if membership.role == MemberRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot remove the project owner")
    db.delete(membership)
    db.commit()


@router.put("/{project_id}/members/{user_id}", response_model=ProjectMemberResponse)
def update_member_role(
    project_id: int,
    user_id: int,
    payload: UpdateMemberRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager),
):
    membership = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == user_id,
    ).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")
    membership.role = payload.role
    db.commit()
    db.refresh(membership)
    return membership


# ── Project status update (team leader and manager) ───────────────────────

@router.patch("/{project_id}/status", response_model=ProjectResponse)
def update_project_status(
    project_id: int,
    payload: ProjectUpdate,  # We only expect status, but we can reuse ProjectUpdate
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check if user is allowed to update this project's status
    # Managers can update any project they created
    # Team leaders can update projects they lead
    is_manager = current_user.role == UserRole.MANAGER and project.created_by == current_user.id
    is_leader = False
    if current_user.role == UserRole.TEAM_LEADER:
        membership = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id,
            ProjectMember.role == MemberRole.TEAM_LEADER,
        ).first()
        is_leader = membership is not None

    if not (is_manager or is_leader):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this project's status",
        )

    old_status = project.status
    if payload.status is not None:
        project.status = payload.status
    # Note: We are only updating status via this endpoint, but if other fields are provided, we ignore them.
    # Alternatively, we could update other fields if needed, but the requirement is for status only.
    # We'll only update status.

    db.commit()
    db.refresh(project)

    # Notify project members about status change
    if old_status != project.status:
        # Notify all project members (except the user who made the change if they are a member)
        for membership in project.members:
            if membership.user_id != current_user.id:
                create_notification(
                    db=db,
                    user_id=membership.user_id,
                    notif_type=NotificationType.PROJECT_STATUS_CHANGED,  # We need to add this type
                    title="Project Status Updated",
                    message=f'Project "{project.name}" status changed from {old_status} to {project.status}.',
                    related_project_id=project.id,
                )
        # Also notify the manager if the changer is not the manager
        if project.created_by != current_user.id:
            create_notification(
                db=db,
                user_id=project.created_by,
                notif_type=NotificationType.PROJECT_STATUS_CHANGED,
                title="Project Status Updated",
                message=f'Project "{project.name}" status changed from {old_status} to {project.status} by {current_user.name}.',
                related_project_id=project.id,
            )

    background_tasks.add_task(
        log_activity, db, current_user.id, "updated_project_status", "project",
        project.id, project.name, project.id,
        f"Status: {old_status} → {project.status}",
    )

    stats = _compute_progress(project)
    resp = ProjectResponse.model_validate(project)
    resp.total_stories = stats["total_stories"]
    resp.total_tasks = stats["total_tasks"]
    resp.completed_tasks = stats["completed_tasks"]
    resp.progress = stats["progress"]
    return resp


# ── Hierarchy endpoint ──────────────────────────────────────────────────────────

@router.get("/{project_id}/hierarchy", response_model=ProjectHierarchy)
def get_project_hierarchy(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .options(
            joinedload(Project.stories)
        )
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_member(project, current_user)

    stories_out = []
    total_all = 0
    done_all = 0

    for story in project.stories:
        tasks_out = []
        for task in story.tasks:
            tasks_out.append(TaskHierarchy.model_validate(task))
        total = len(story.tasks)
        done = sum(1 for t in story.tasks if t.status == TaskStatus.DONE)
        total_all += total
        done_all += done
        stories_out.append(
            StoryHierarchy(
                id=story.id,
                title=story.title,
                description=story.description,
                priority=story.priority,
                status=story.status,
                tasks=tasks_out,
                total_tasks=total,
                completed_tasks=done,
                progress=round(done / total * 100, 1) if total else 0.0,
            )
        )

    return ProjectHierarchy(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        stories=stories_out,
        total_tasks=total_all,
        completed_tasks=done_all,
        progress=round(done_all / total_all * 100, 1) if total_all else 0.0,
    )


def _assert_member(project: Project, user: User):
    if user.role == UserRole.MANAGER:
        return  # Managers have full access to all projects
    is_member = any(m.user_id == user.id for m in project.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Access denied: not a project member")
