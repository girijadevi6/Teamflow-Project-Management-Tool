from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..models.story import UserStory
from ..models.task import Task
from ..models.time_log import TimeLog
from ..schemas.time_log import TimeLogCreate, TimeLogResponse
from ..services.activity_service import log_activity

router = APIRouter(prefix="/tasks/{task_id}/time-logs", tags=["Time Tracking"])


def _assert_project_member(task: Task, user: User):
    project = task.story.project if task.story else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if user.role == UserRole.MANAGER and project.created_by == user.id:
        return
    is_member = any(m.user_id == user.id for m in project.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Access denied: not a project member")


@router.post("", response_model=TimeLogResponse, status_code=status.HTTP_201_CREATED)
def create_time_log(
    task_id: int,
    payload: TimeLogCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.hours <= 0:
        raise HTTPException(status_code=400, detail="Logged hours must be greater than 0")

    task = (
        db.query(Task)
        .options(joinedload(Task.story).joinedload(UserStory.project))
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    _assert_project_member(task, current_user)

    time_log = TimeLog(
        task_id=task_id,
        user_id=current_user.id,
        hours=payload.hours,
        description=payload.description,
    )
    db.add(time_log)

    # Auto-update logged_hours on the task
    task.logged_hours = (task.logged_hours or 0.0) + payload.hours

    db.commit()
    db.refresh(time_log)

    time_log = (
        db.query(TimeLog)
        .options(joinedload(TimeLog.user))
        .filter(TimeLog.id == time_log.id)
        .first()
    )

    background_tasks.add_task(
        log_activity,
        db,
        current_user.id,
        "logged_time",
        "task",
        task.id,
        task.title,
        task.story.project_id,
        f"Logged {payload.hours}h: {payload.description or ''}",
    )

    return time_log


@router.get("", response_model=List[TimeLogResponse])
def list_time_logs(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = (
        db.query(Task)
        .options(joinedload(Task.story).joinedload(UserStory.project))
        .filter(Task.id == task_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    _assert_project_member(task, current_user)

    logs = (
        db.query(TimeLog)
        .options(joinedload(TimeLog.user))
        .filter(TimeLog.task_id == task_id)
        .order_by(TimeLog.logged_at.desc())
        .all()
    )
    return logs