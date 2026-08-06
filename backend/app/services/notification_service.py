from sqlalchemy.orm import Session
from ..models.notification import Notification, NotificationType
from ..models.task import Task
from ..models.user import User
from ..models.project import ProjectMember, MemberRole
from ..models.comment import Comment


def create_notification(
    db: Session,
    user_id: int,
    notif_type: NotificationType,
    title: str,
    message: str,
    related_project_id: int = None,
    related_task_id: int = None,
    related_story_id: int = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        related_project_id=related_project_id,
        related_task_id=related_task_id,
        related_story_id=related_story_id,
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


def notify_task_assigned(db: Session, task: Task, assigned_by: User):
    """Fire a notification when a task is assigned to a user."""
    if not task.assigned_to or task.assigned_to == assigned_by.id:
        return

    project_id = task.story.project_id if task.story else None
    project_name = task.story.project.name if task.story and task.story.project else "your project"
    due_str = str(task.due_date) if task.due_date else "No due date"

    create_notification(
        db=db,
        user_id=task.assigned_to,
        notif_type=NotificationType.TASK_ASSIGNED,
        title="New Task Assigned",
        message=(
            f'You have been assigned: "{task.title}" '
            f"in project \"{project_name}\". Due: {due_str}."
        ),
        related_project_id=project_id,
        related_task_id=task.id,
        related_story_id=task.story_id,
    )


def notify_task_unassigned(db: Session, task: Task, old_assignee_id: int, by_user: User):
    """Notify a user when they are removed from a task."""
    if old_assignee_id == by_user.id:
        return
    create_notification(
        db=db,
        user_id=old_assignee_id,
        notif_type=NotificationType.TASK_UNASSIGNED,
        title="Removed from Task",
        message=f'You have been removed from the task: "{task.title}".',
        related_task_id=task.id,
        related_story_id=task.story_id,
    )


def notify_task_status_changed(db: Session, task: Task, old_status: str, changed_by: User):
    """Notify the task creator when a member changes status."""
    if task.created_by == changed_by.id:
        return
    create_notification(
        db=db,
        user_id=task.created_by,
        notif_type=NotificationType.TASK_STATUS_CHANGED,
        title="Task Status Updated",
        message=(
            f'Task "{task.title}" status changed '
            f'from {old_status} to {task.status} by {changed_by.name}.'
        ),
        related_task_id=task.id,
        related_story_id=task.story_id,
    )


def notify_added_to_project(db: Session, user_id: int, project_name: str, project_id: int):
    """Notify a user when they are added to a project."""
    create_notification(
        db=db,
        user_id=user_id,
        notif_type=NotificationType.PROJECT_ADDED,
        title="Added to Project",
        message=f'You have been added to the project: "{project_name}".',
        related_project_id=project_id,
    )


def notify_story_completed(db: Session, story, completed_by: User):
    """Notify the project owner when a story is marked DONE."""
    project = story.project
    if not project:
        return
    # Notify the manager/owner
    owner_membership = next(
        (m for m in project.members if m.role == MemberRole.OWNER), None
    )
    if owner_membership and owner_membership.user_id != completed_by.id:
        create_notification(
            db=db,
            user_id=owner_membership.user_id,
            notif_type=NotificationType.STORY_COMPLETED,
            title="User Story Completed",
            message=f'User story "{story.title}" has been completed in project "{project.name}".',
            related_project_id=project.id,
            related_story_id=story.id,
        )


def notify_comment_added(db: Session, comment: Comment, commented_by: User):
    """Notify the task assignee and creator when a comment is added."""
    task = comment.task
    if not task:
        return
    # Notify the assignee (if not the commenter)
    if task.assigned_to and task.assigned_to != commented_by.id:
        create_notification(
            db=db,
            user_id=task.assigned_to,
            notif_type=NotificationType.COMMENT_ADDED,
            title="New Comment on Task",
            message=f'User {commented_by.name} commented on task "{task.title}": "{comment.content[:100]}..."',
            related_task_id=task.id,
            related_story_id=task.story_id,
        )
    # Notify the creator (if not the commenter and not the same as assignee)
    if task.created_by != commented_by.id and task.created_by != task.assigned_to:
        create_notification(
            db=db,
            user_id=task.created_by,
            notif_type=NotificationType.COMMENT_ADDED,
            title="New Comment on Task",
            message=f'User {commented_by.name} commented on task "{task.title}": "{comment.content[:100]}..."',
            related_task_id=task.id,
            related_story_id=task.story_id,
        )
