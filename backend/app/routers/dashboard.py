from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from datetime import date

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..models.project import Project, ProjectMember
from ..models.story import UserStory
from ..models.task import Task, TaskStatus
from ..models.activity import ActivityLog
from ..schemas.activity import DashboardStats, ActivityLogResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today = date.today()

    # Determine which project IDs this user can see
    if current_user.role == UserRole.MANAGER:
        projects = (
            db.query(Project)
            .options(joinedload(Project.stories).joinedload(UserStory.tasks))
            .filter(Project.created_by == current_user.id)
            .all()
        )
        project_ids = [p.id for p in projects]
    else:
        memberships = db.query(ProjectMember).filter(ProjectMember.user_id == current_user.id).all()
        project_ids = [m.project_id for m in memberships]
        projects = (
            db.query(Project)
            .options(joinedload(Project.stories).joinedload(UserStory.tasks))
            .filter(Project.id.in_(project_ids))
            .all()
        )

    total_projects = len(projects)
    active_projects = sum(1 for p in projects if p.status.value == "ACTIVE")
    pending_projects = sum(1 for p in projects if p.status.value == "PENDING")

    # All tasks across visible projects
    all_tasks = (
        db.query(Task)
        .join(UserStory, Task.story_id == UserStory.id)
        .filter(UserStory.project_id.in_(project_ids))
        .all()
    )

    total_tasks = len(all_tasks)
    completed_tasks = sum(1 for t in all_tasks if t.status == TaskStatus.DONE)
    in_progress_tasks = sum(1 for t in all_tasks if t.status == TaskStatus.IN_PROGRESS)
    overdue_tasks = sum(
        1 for t in all_tasks
        if t.due_date and t.due_date < today and t.status != TaskStatus.DONE
    )
    urgent_tasks = sum(1 for t in all_tasks if t.priority.value == "URGENT" and t.status != TaskStatus.DONE)
    my_assigned = sum(1 for t in all_tasks if t.assigned_to == current_user.id)

    # Story points
    total_story_points = sum(t.story_points for t in all_tasks)
    completed_story_points = sum(t.story_points for t in all_tasks if t.status == TaskStatus.DONE)

    # Recent activity (last 10 entries visible to this user)
    recent = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.user))
        .filter(ActivityLog.project_id.in_(project_ids))
        .order_by(ActivityLog.created_at.desc())
        .limit(10)
        .all()
    )

    return DashboardStats(
        total_projects=total_projects,
        active_projects=active_projects,
        pending_projects=pending_projects,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        overdue_tasks=overdue_tasks,
        urgent_tasks=urgent_tasks,
        total_story_points=total_story_points,
        completed_story_points=completed_story_points,
        my_assigned_tasks=my_assigned,
        recent_activity=[ActivityLogResponse.model_validate(a) for a in recent],
    )


@router.get("/activity", response_model=list[ActivityLogResponse])
def get_activity(
    project_id: int = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(ActivityLog)
        .options(joinedload(ActivityLog.user))
    )
    if project_id:
        query = query.filter(ActivityLog.project_id == project_id)
    return query.order_by(ActivityLog.created_at.desc()).limit(limit).all()
