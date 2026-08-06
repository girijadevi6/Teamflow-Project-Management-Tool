from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..models.story import UserStory
from ..models.task import Task
from ..models.comment import Comment
from ..schemas.comment import CommentCreate, CommentResponse
from ..services.notification_service import notify_comment_added
from ..services.activity_service import log_activity

router = APIRouter(prefix="/tasks/{task_id}/comments", tags=["Comments"])


def _assert_project_member(task: Task, user: User):
    project = task.story.project if task.story else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if user.role == UserRole.MANAGER and project.created_by == user.id:
        return
    is_member = any(m.user_id == user.id for m in project.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Access denied: not a project member")


@router.post("", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    task_id: int,
    payload: CommentCreate,
    background_tasks: BackgroundTasks,
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

    comment = Comment(
        task_id=task_id,
        user_id=current_user.id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    # Reload comment with user relationship
    comment = (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.id == comment.id)
        .first()
    )

    background_tasks.add_task(notify_comment_added, db, comment, current_user)
    background_tasks.add_task(
        log_activity,
        db,
        current_user.id,
        "added_comment",
        "comment",
        comment.id,
        task.title,
        task.story.project_id,
        f"Comment: {payload.content[:50]}...",
    )

    return comment


@router.get("", response_model=List[CommentResponse])
def list_comments(
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

    comments = (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.task_id == task_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return comments


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comment = db.query(Comment).filter(Comment.id == comment_id, Comment.task_id == task_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != current_user.id and current_user.role not in (UserRole.MANAGER, UserRole.TEAM_LEADER):
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    db.delete(comment)
    db.commit()