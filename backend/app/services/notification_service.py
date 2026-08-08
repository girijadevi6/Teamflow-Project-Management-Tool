from typing import Optional
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from ..models.notification import Notification, NotificationType
from ..models.task import Task, Priority
from ..models.user import User, UserRole
from ..models.project import Project, ProjectMember, MemberRole
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
            f'{assigned_by.name} assigned you to task "{task.title}" '
            f'in project "{project_name}". Due: {due_str}.'
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
        message=f'{by_user.name} removed you from the task: "{task.title}".',
        related_task_id=task.id,
        related_story_id=task.story_id,
    )


def notify_task_status_changed(db: Session, task: Task, old_status: str, changed_by: User):
    """Notify the task creator when a member changes status."""
    if task.created_by == changed_by.id:
        return
    project_name = task.story.project.name if task.story and task.story.project else "your project"
    create_notification(
        db=db,
        user_id=task.created_by,
        notif_type=NotificationType.TASK_STATUS_CHANGED,
        title="Task Status Updated",
        message=(
            f'{changed_by.name} moved task "{task.title}" '
            f'from {old_status} to {task.status} in project "{project_name}".'
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
            message=(
                f'{completed_by.name} completed user story "{story.title}" '
                f'in project "{project.name}".'
            ),
            related_project_id=project.id,
            related_story_id=story.id,
        )


def notify_comment_added(db: Session, comment: Comment, commented_by: User):
    """Notify relevant project members when a comment is added to a task."""
    task = comment.task
    if not task or not task.story or not task.story.project:
        return
    project = task.story.project
    project_name = project.name
    preview = comment.content[:100] + ("..." if len(comment.content) > 100 else "")

    recipient_ids = set()

    # Task Assignee
    if task.assigned_to and task.assigned_to != commented_by.id:
        recipient_ids.add(task.assigned_to)

    # Task Creator
    if task.created_by and task.created_by != commented_by.id:
        recipient_ids.add(task.created_by)

    # Project Members (Leader + Team Members)
    for membership in project.members:
        if membership.user_id != commented_by.id:
            recipient_ids.add(membership.user_id)

    # Project Creator (Manager)
    if project.created_by and project.created_by != commented_by.id:
        recipient_ids.add(project.created_by)

    for uid in recipient_ids:
        create_notification(
            db=db,
            user_id=uid,
            notif_type=NotificationType.COMMENT_ADDED,
            title="New Comment on Task",
            message=(
                f'{commented_by.name} commented on task "{task.title}" '
                f'in project "{project_name}": "{preview}"'
            ),
            related_project_id=project.id,
            related_task_id=task.id,
            related_story_id=task.story_id,
        )


def notify_task_submitted_for_review(db: Session, task: Task, submitted_by: User):
    """Notify project team leaders when a member submits a task for review."""
    if not task.story or not task.story.project:
        return
    project = task.story.project
    for membership in project.members:
        if membership.role == MemberRole.TEAM_LEADER and membership.user_id != submitted_by.id:
            create_notification(
                db=db,
                user_id=membership.user_id,
                notif_type=NotificationType.TASK_SUBMITTED_FOR_REVIEW,
                title="Task Submitted for Review",
                message=(
                    f'{submitted_by.name} submitted task "{task.title}" '
                    f'in project "{project.name}" for your review.'
                ),
                related_project_id=project.id,
                related_task_id=task.id,
                related_story_id=task.story_id,
            )
    # Also notify the manager (project creator) if they are not the submitter
    if project.created_by and project.created_by != submitted_by.id:
        # Check if creator is already a team leader (avoid duplicate)
        is_leader = any(
            m.user_id == project.created_by and m.role == MemberRole.TEAM_LEADER
            for m in project.members
        )
        if not is_leader:
            create_notification(
                db=db,
                user_id=project.created_by,
                notif_type=NotificationType.TASK_SUBMITTED_FOR_REVIEW,
                title="Task Submitted for Review",
                message=(
                    f'{submitted_by.name} submitted task "{task.title}" '
                    f'in project "{project.name}" for review.'
                ),
                related_project_id=project.id,
                related_task_id=task.id,
                related_story_id=task.story_id,
            )


def notify_task_changes_requested(db: Session, task: Task, requested_by: User, comment: str = ""):
    """Notify the task assignee that changes have been requested by the reviewer."""
    if not task.assigned_to or task.assigned_to == requested_by.id:
        return
    comment_text = f' Comment: "{comment}"' if comment else ""
    project_name = task.story.project.name if task.story and task.story.project else "your project"
    create_notification(
        db=db,
        user_id=task.assigned_to,
        notif_type=NotificationType.TASK_CHANGES_REQUESTED,
        title="Changes Requested on Task",
        message=(
            f'{requested_by.name} requested changes on task "{task.title}" '
            f'in project "{project_name}".{comment_text}'
        ),
        related_project_id=task.story.project_id if task.story else None,
        related_task_id=task.id,
        related_story_id=task.story_id,
    )


def notify_task_approved(db: Session, task: Task, approved_by: User):
    """Notify the task assignee when their task is approved (marked as DONE) by a reviewer."""
    if not task.assigned_to or task.assigned_to == approved_by.id:
        return
    project_name = task.story.project.name if task.story and task.story.project else "your project"
    create_notification(
        db=db,
        user_id=task.assigned_to,
        notif_type=NotificationType.TASK_APPROVED,
        title="Task Approved ✅",
        message=(
            f'{approved_by.name} approved your task "{task.title}" '
            f'in project "{project_name}" and marked it as completed.'
        ),
        related_project_id=task.story.project_id if task.story else None,
        related_task_id=task.id,
        related_story_id=task.story_id,
    )


# ── Project-level review workflow notifications ─────────────────────────────


def notify_project_submitted_for_review(db: Session, project: Project, submitted_by: User):
    """Notify all managers when a team leader submits a project for review."""
    # Find all managers
    managers = db.query(User).filter(User.role == "MANAGER").all()
    manager_ids = {m.id for m in managers}
    if project.created_by:
        manager_ids.add(project.created_by)

    for mgr_id in manager_ids:
        if mgr_id != submitted_by.id:
            create_notification(
                db=db,
                user_id=mgr_id,
                notif_type=NotificationType.PROJECT_SUBMITTED_FOR_REVIEW,
                title="Project Submitted for Review 📥",
                message=(
                    f'{submitted_by.name} submitted project "{project.name}" '
                    f'for your review. Please review and mark as completed or request changes.'
                ),
                related_project_id=project.id,
            )


def notify_project_changes_requested(
    db: Session, project: Project, requested_by: User, comment: str = ""
):
    """Notify the team leader(s) when the manager requests changes on a project."""
    comment_text = f' Feedback: "{comment}"' if comment else ""
    for membership in project.members:
        if membership.role == MemberRole.TEAM_LEADER and membership.user_id != requested_by.id:
            create_notification(
                db=db,
                user_id=membership.user_id,
                notif_type=NotificationType.PROJECT_CHANGES_REQUESTED,
                title="Changes Requested on Project",
                message=(
                    f'{requested_by.name} requested changes on project "{project.name}".{comment_text}'
                ),
                related_project_id=project.id,
            )


def notify_project_completed(db: Session, project: Project, approved_by: User):
    """Notify all project members when the manager marks a project as completed."""
    for membership in project.members:
        if membership.user_id != approved_by.id:
            create_notification(
                db=db,
                user_id=membership.user_id,
                notif_type=NotificationType.PROJECT_COMPLETED,
                title="Project Completed 🎉",
                message=(
                    f'{approved_by.name} marked project "{project.name}" as completed. '
                    f'Great work, team!'
                ),
                related_project_id=project.id,
            )


def notify_urgent_task_assigned(
    db: Session, task: Task, created_by: User, raw_due_date: Optional[str] = None
):
    """
    Fire a notification when a leader/manager creates (or updates) an urgent task
    assigned to a team member that has less than 2 hours to complete from time now.
    """
    if not task.assigned_to or task.assigned_to == created_by.id:
        return

    # Must be URGENT priority
    if task.priority != Priority.URGENT:
        return

    # Check if creator is a Team Leader or Manager (by User role or Project Member role)
    is_leader_or_mgr = created_by.role in [UserRole.TEAM_LEADER, UserRole.MANAGER]
    if not is_leader_or_mgr and task.story and task.story.project:
        is_leader_or_mgr = any(
            m.user_id == created_by.id and m.role in [MemberRole.TEAM_LEADER, MemberRole.OWNER]
            for m in task.story.project.members
        )

    if not is_leader_or_mgr:
        return

    now_local = datetime.now()
    now_utc = datetime.utcnow()
    is_urgent_due_soon = False

    # 1. Check estimated_hours if set (<= 2 hours)
    if task.estimated_hours is not None and 0 < task.estimated_hours <= 2.0:
        is_urgent_due_soon = True

    # 2. Check raw_due_date string (e.g. ISO string "2026-08-08T12:00:00")
    check_str = raw_due_date or (str(task.due_date) if task.due_date else None)
    if check_str:
        if "T" in check_str or " " in check_str:
            try:
                clean_str = check_str.replace("Z", "+00:00")
                due_dt = datetime.fromisoformat(clean_str)
                if due_dt.tzinfo is not None:
                    remaining = (due_dt - datetime.now(timezone.utc)).total_seconds()
                else:
                    remaining = (due_dt - now_local).total_seconds()

                if 0 < remaining <= 2 * 3600:
                    is_urgent_due_soon = True
            except ValueError:
                pass

    # 3. Check if due date is today or missing (urgent tasks default to due immediately / < 2 hrs)
    if not is_urgent_due_soon:
        if task.due_date is None or task.due_date == now_local.date() or task.due_date == now_utc.date():
            if task.estimated_hours is None or task.estimated_hours <= 2.0:
                is_urgent_due_soon = True

    if is_urgent_due_soon:
        project_id = task.story.project_id if task.story else None
        project_name = task.story.project.name if task.story and task.story.project else "your project"

        create_notification(
            db=db,
            user_id=task.assigned_to,
            notif_type=NotificationType.URGENT_TASK_ASSIGNED,
            title="🚨 Urgent Task Assigned (Due in < 2 hrs)",
            message=(
                f'{created_by.name} assigned you an urgent task "{task.title}" '
                f'in project "{project_name}" with less than 2 hours to complete!'
            ),
            related_project_id=project_id,
            related_task_id=task.id,
            related_story_id=task.story_id,
        )
