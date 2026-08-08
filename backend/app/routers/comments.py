from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

from ..database import get_db
from ..dependencies import get_current_user
from ..models.user import User, UserRole
from ..models.story import UserStory
from ..models.task import Task
from ..models.comment import Comment
from ..schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from ..services.notification_service import notify_comment_added
from ..services.activity_service import log_activity

router = APIRouter(tags=["Comments"])


def _assert_project_member(task: Task, user: User):
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    project = task.story.project if task.story else None
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if user.role == UserRole.MANAGER:
        return
    is_member = any(m.user_id == user.id for m in project.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Access denied: not a project member")


@router.post("/tasks/{task_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    task_id: int,
    payload: CommentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")

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
        content=payload.content.strip(),
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

    if background_tasks:
        background_tasks.add_task(notify_comment_added, db, comment, current_user)
        background_tasks.add_task(
            log_activity,
            db,
            current_user.id,
            "added_comment",
            "comment",
            comment.id,
            task.title,
            task.story.project_id if task.story else None,
            f"Comment: {payload.content[:50]}...",
        )

    return comment


@router.get("/tasks/{task_id}/comments", response_model=List[CommentResponse])
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


def _update_comment_logic(comment_id: int, payload: CommentUpdate, db: Session, current_user: User) -> CommentResponse:
    comment = (
        db.query(Comment)
        .options(joinedload(Comment.task).joinedload(Task.story).joinedload(UserStory.project))
        .filter(Comment.id == comment_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    _assert_project_member(comment.task, current_user)

    if comment.user_id != current_user.id and current_user.role not in (UserRole.MANAGER, UserRole.TEAM_LEADER):
        raise HTTPException(status_code=403, detail="You can only edit your own comments")

    if not payload.content or not payload.content.strip():
        raise HTTPException(status_code=400, detail="Comment content cannot be empty")

    comment.content = payload.content.strip()
    comment.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(comment)

    return (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.id == comment.id)
        .first()
    )


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment_standalone(
    comment_id: int,
    payload: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _update_comment_logic(comment_id, payload, db, current_user)


@router.put("/tasks/{task_id}/comments/{comment_id}", response_model=CommentResponse)
def update_comment_nested(
    task_id: int,
    comment_id: int,
    payload: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _update_comment_logic(comment_id, payload, db, current_user)


def _delete_comment_logic(comment_id: int, db: Session, current_user: User):
    comment = (
        db.query(Comment)
        .options(joinedload(Comment.task).joinedload(Task.story).joinedload(UserStory.project))
        .filter(Comment.id == comment_id)
        .first()
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    _assert_project_member(comment.task, current_user)

    if comment.user_id != current_user.id and current_user.role not in (UserRole.MANAGER, UserRole.TEAM_LEADER):
        raise HTTPException(status_code=403, detail="You can only delete your own comments")

    db.delete(comment)
    db.commit()


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment_standalone(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _delete_comment_logic(comment_id, db, current_user)


@router.delete("/tasks/{task_id}/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment_nested(
    task_id: int,
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _delete_comment_logic(comment_id, db, current_user)