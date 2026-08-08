from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional

from ..database import get_db
from ..dependencies import get_current_user, require_manager_or_leader
from ..models.user import User, UserRole
from ..models.project import Project, ProjectMember
from ..models.story import UserStory
from ..models.task import Task, TaskStatus
from ..schemas.task import TaskCreate, TaskUpdate, TaskStatusUpdate, TaskAssignUpdate, TaskResponse
from ..services.notification_service import (
    notify_task_assigned,
    notify_task_unassigned,
    notify_task_status_changed,
    notify_task_submitted_for_review,
    notify_task_changes_requested,
    notify_task_approved,
    notify_urgent_task_assigned,
)
from ..services.activity_service import log_activity

router = APIRouter(tags=["Tasks"])

# Allowed status transitions for members (cannot mark as DONE)
MEMBER_ALLOWED_TRANSITIONS: dict[str, list[str]] = {
    "TODO": ["IN_PROGRESS"],
    "IN_PROGRESS": ["TODO", "IN_REVIEW"],
    "IN_REVIEW": ["IN_PROGRESS"],  # self-correction only
    "DONE": [],  # members can never move out of DONE
}


def _parse_due_date(val) -> Optional[date]:
    if not val:
        return None
    if isinstance(val, date) and not isinstance(val, datetime):
        return val
    if isinstance(val, datetime):
        return val.date()
    if isinstance(val, str):
        try:
            return datetime.fromisoformat(val.replace("Z", "+00:00")).date()
        except ValueError:
            try:
                return date.fromisoformat(val[:10])
            except ValueError:
                return None
    return None


def _build_task_response(task: Task) -> TaskResponse:
    resp = TaskResponse.model_validate(task)
    if task.story:
        resp.story_title = task.story.title
        if task.story.project:
            resp.project_id = task.story.project_id
            resp.project_name = task.story.project.name
    return resp


def _get_story_with_project(story_id: int, db: Session) -> UserStory:
    story = (
        db.query(UserStory)
        .options(
            joinedload(UserStory.project).joinedload(Project.members),
        )
        .filter(UserStory.id == story_id)
        .first()
    )
    if not story:
        raise HTTPException(status_code=404, detail="User story not found")
    return story


def _assert_member(project: Project, user: User):
    if user.role == UserRole.MANAGER:
        return  # Managers have full access to all projects
    if not any(m.user_id == user.id for m in project.members):
        raise HTTPException(status_code=403, detail="Access denied: not a project member")


# ── CRUD ───────────────────────────────────────────────────────────────────────

@router.post(
    "/stories/{story_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_task(
    story_id: int,
    payload: TaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_leader),
):
    story = _get_story_with_project(story_id, db)
    _assert_member(story.project, current_user)

    # Validate assignee is a project member
    if payload.assigned_to:
        is_member = any(m.user_id == payload.assigned_to for m in story.project.members)
        if not is_member:
            raise HTTPException(status_code=400, detail="Assignee is not a project member")

    due_date_obj = _parse_due_date(payload.due_date)
    raw_due_str = str(payload.due_date) if payload.due_date else None

    task = Task(
        story_id=story_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=payload.status,
        assigned_to=payload.assigned_to,
        due_date=due_date_obj,
        story_points=payload.story_points,
        estimated_hours=payload.estimated_hours,
        created_by=current_user.id,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    # Reload with relationships
    task = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project),
        )
        .filter(Task.id == task.id)
        .first()
    )

    # Fire async notification for assignment
    if payload.assigned_to:
        background_tasks.add_task(notify_task_assigned, db, task, current_user)
        background_tasks.add_task(notify_urgent_task_assigned, db, task, current_user, raw_due_str)

    background_tasks.add_task(
        log_activity, db, current_user.id, "created_task", "task",
        task.id, task.title, story.project_id,
    )

    return _build_task_response(task)


@router.get("/stories/{story_id}/tasks", response_model=List[TaskResponse])
def list_tasks(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = _get_story_with_project(story_id, db)
    _assert_member(story.project, current_user)

    tasks = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project),
        )
        .filter(Task.story_id == story_id)
        .all()
    )
    return [_build_task_response(t) for t in tasks]


@router.get("/tasks/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project).joinedload(Project.members),
        )
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _assert_member(task.story.project, current_user)
    return _build_task_response(task)


@router.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_leader),
):
    task = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project).joinedload(Project.members),
        )
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _assert_member(task.story.project, current_user)

    old_assignee = task.assigned_to
    old_status = task.status

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.due_date is not None:
        task.due_date = _parse_due_date(payload.due_date)
    if payload.story_points is not None:
        task.story_points = payload.story_points
    if payload.estimated_hours is not None:
        task.estimated_hours = payload.estimated_hours

    if payload.assigned_to is not None:
        is_member = any(m.user_id == payload.assigned_to for m in task.story.project.members)
        if not is_member:
            raise HTTPException(status_code=400, detail="Assignee is not a project member")
        task.assigned_to = payload.assigned_to

    if payload.status is not None:
        task.status = payload.status

    db.commit()
    db.refresh(task)

    # Reload fresh
    task = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project),
        )
        .filter(Task.id == task.id)
        .first()
    )

    # Notifications
    if old_assignee != task.assigned_to:
        if old_assignee:
            background_tasks.add_task(notify_task_unassigned, db, task, old_assignee, current_user)
        if task.assigned_to:
            background_tasks.add_task(notify_task_assigned, db, task, current_user)

    if task.assigned_to:
        raw_due_str = str(payload.due_date) if payload.due_date else (str(task.due_date) if task.due_date else None)
        background_tasks.add_task(notify_urgent_task_assigned, db, task, current_user, raw_due_str)

    if old_status != task.status:
        background_tasks.add_task(notify_task_status_changed, db, task, str(old_status), current_user)

    background_tasks.add_task(
        log_activity, db, current_user.id, "updated_task", "task",
        task.id, task.title, task.story.project_id,
        f"Status: {old_status} → {task.status}",
    )

    return _build_task_response(task)


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_leader),
):
    task = (
        db.query(Task)
        .options(joinedload(Task.story).joinedload(UserStory.project).joinedload(Project.members))
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _assert_member(task.story.project, current_user)
    db.delete(task)
    db.commit()


# ── Dedicated status patch (members can use this) ─────────────────────────────

@router.patch("/tasks/{task_id}/status", response_model=TaskResponse)
def update_task_status(
    task_id: int,
    payload: TaskStatusUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project).joinedload(Project.members),
        )
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _assert_member(task.story.project, current_user)

    # Members can only move tasks assigned to them
    if current_user.role == UserRole.MEMBER and task.assigned_to != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Members can only update status of tasks assigned to them",
        )

    old_status = task.status
    new_status = payload.status

    # Enforce status transition rules for members
    if current_user.role == UserRole.MEMBER:
        allowed = MEMBER_ALLOWED_TRANSITIONS.get(old_status.value, [])
        if new_status.value not in allowed:
            if new_status.value == "DONE":
                raise HTTPException(
                    status_code=403,
                    detail="Members cannot mark tasks as completed. Submit for review instead (move to IN_REVIEW).",
                )
            raise HTTPException(
                status_code=403,
                detail=f"Members cannot move tasks from {old_status.value} to {new_status.value}.",
            )

    task.status = new_status
    db.commit()
    db.refresh(task)

    task = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project).joinedload(Project.members),
        )
        .filter(Task.id == task.id)
        .first()
    )

    # ── Review workflow notifications ──────────────────────────────────────
    # Member submits for review → notify leaders
    if new_status == TaskStatus.IN_REVIEW and old_status != TaskStatus.IN_REVIEW:
        background_tasks.add_task(notify_task_submitted_for_review, db, task, current_user)

    # Leader/manager moves task from IN_REVIEW back to IN_PROGRESS → changes requested
    if (
        old_status == TaskStatus.IN_REVIEW
        and new_status == TaskStatus.IN_PROGRESS
        and current_user.role in (UserRole.MANAGER, UserRole.TEAM_LEADER)
    ):
        background_tasks.add_task(
            notify_task_changes_requested, db, task, current_user, payload.comment or ""
        )

    # Leader/manager marks task as DONE from IN_REVIEW → approved
    if (
        old_status == TaskStatus.IN_REVIEW
        and new_status == TaskStatus.DONE
        and current_user.role in (UserRole.MANAGER, UserRole.TEAM_LEADER)
    ):
        background_tasks.add_task(notify_task_approved, db, task, current_user)

    # General status change notification (for creator)
    background_tasks.add_task(notify_task_status_changed, db, task, str(old_status), current_user)
    background_tasks.add_task(
        log_activity, db, current_user.id, "moved_task", "task",
        task.id, task.title, task.story.project_id,
        f"{old_status} → {task.status}",
    )

    return _build_task_response(task)


# ── Dedicated assign patch (leaders/managers only) ────────────────────────────

@router.patch("/tasks/{task_id}/assign", response_model=TaskResponse)
def assign_task(
    task_id: int,
    payload: TaskAssignUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_leader),
):
    task = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project).joinedload(Project.members),
        )
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    _assert_member(task.story.project, current_user)

    old_assignee = task.assigned_to

    if payload.assigned_to is not None:
        is_member = any(m.user_id == payload.assigned_to for m in task.story.project.members)
        if not is_member:
            raise HTTPException(status_code=400, detail="Assignee is not a project member")

    task.assigned_to = payload.assigned_to
    db.commit()
    db.refresh(task)

    task = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project),
        )
        .filter(Task.id == task.id)
        .first()
    )

    if old_assignee and old_assignee != task.assigned_to:
        background_tasks.add_task(notify_task_unassigned, db, task, old_assignee, current_user)
    if task.assigned_to:
        background_tasks.add_task(notify_task_assigned, db, task, current_user)

    background_tasks.add_task(
        log_activity, db, current_user.id, "assigned_task", "task",
        task.id, task.title, task.story.project_id,
    )

    return _build_task_response(task)


# ── My tasks (across all projects) ────────────────────────────────────────────

@router.get("/tasks/my/assigned", response_model=List[TaskResponse])
def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project),
        )
        .filter(Task.assigned_to == current_user.id)
        .order_by(Task.due_date.asc().nullslast())
        .all()
    )
    return [_build_task_response(t) for t in tasks]


# ── Kanban: all tasks in a project grouped by status ──────────────────────────

@router.get("/projects/{project_id}/kanban", response_model=dict)
def get_kanban(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .options(joinedload(Project.members))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_member(project, current_user)

    tasks = (
        db.query(Task)
        .options(
            joinedload(Task.assignee),
            joinedload(Task.creator),
            joinedload(Task.story).joinedload(UserStory.project),
        )
        .join(UserStory, Task.story_id == UserStory.id)
        .filter(UserStory.project_id == project_id)
        .all()
    )

    board: dict = {s.value: [] for s in TaskStatus}
    for task in tasks:
        board[task.status.value].append(_build_task_response(task).model_dump())

    return board
