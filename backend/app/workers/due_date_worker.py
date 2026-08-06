"""
Due-date notification worker.

This module scans for:
1. Tasks due tomorrow (TASK_DUE_SOON)
2. Projects with deadline in 3 days (PROJECT_DEADLINE_APPROACHING)
3. Overdue tasks (TASK_OVERDUE)

It is intended to be run as a scheduled job (e.g. once per hour via
a background task started with the FastAPI lifespan).
"""

import asyncio
import logging
from datetime import date, timedelta

from sqlalchemy.orm import Session, joinedload

from ..database import SessionLocal
from ..models.task import Task, TaskStatus
from ..models.story import UserStory
from ..models.project import Project, ProjectMember, ProjectStatus, ProjectPriority, MemberRole
from ..models.notification import Notification, NotificationType

logger = logging.getLogger("teamflow.worker")


def check_due_soon(db: Session) -> int:
    """
    Create TASK_DUE_SOON notifications for tasks due tomorrow
    that do not already have one for today.
    Returns the number of notifications created.
    """
    tomorrow = date.today() + timedelta(days=1)
    count = 0

    tasks = (
        db.query(Task)
        .options(
            joinedload(Task.story).joinedload(UserStory.project),
        )
        .filter(
            Task.due_date == tomorrow,
            Task.assigned_to.isnot(None),
            Task.status != TaskStatus.DONE,
        )
        .all()
    )

    for task in tasks:
        # Avoid duplicate notifications on the same day
        already = (
            db.query(Notification)
            .filter(
                Notification.user_id == task.assigned_to,
                Notification.type == NotificationType.TASK_DUE_SOON,
                Notification.related_task_id == task.id,
            )
            .first()
        )
        if already:
            continue

        project_name = (
            task.story.project.name if task.story and task.story.project else "your project"
        )

        notif = Notification(
            user_id=task.assigned_to,
            type=NotificationType.TASK_DUE_SOON,
            title="Task Due Tomorrow",
            message=(
                f'Reminder: "{task.title}" in project "{project_name}" '
                f"is due tomorrow ({tomorrow})."
            ),
            related_project_id=task.story.project_id if task.story else None,
            related_task_id=task.id,
            related_story_id=task.story_id,
        )
        db.add(notif)
        count += 1

    if count:
        db.commit()
        logger.info("Due-soon worker: created %d notifications for %s", count, tomorrow)

    return count


def check_project_deadlines(db: Session) -> int:
    """
    Notify team leader and manager when project deadline is approaching (3 days).
    Returns the number of notifications created.
    """
    target_date = date.today() + timedelta(days=3)
    count = 0

    projects = (
        db.query(Project)
        .options(
            joinedload(Project.members).joinedload(ProjectMember.user),
        )
        .filter(
            Project.deadline == target_date,
            Project.status.in_([ProjectStatus.PLANNING, ProjectStatus.ACTIVE, ProjectStatus.PENDING, ProjectStatus.ON_HOLD]),
        )
        .all()
    )

    for project in projects:
        # Notify team leader(s)
        for membership in project.members:
            if membership.role == MemberRole.TEAM_LEADER:
                # Avoid duplicate notifications for the same project and day
                already = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == membership.user_id,
                        Notification.type == NotificationType.PROJECT_DEADLINE_APPROACHING,
                        Notification.related_project_id == project.id,
                    )
                    .first()
                )
                if already:
                    continue

                notif = Notification(
                    user_id=membership.user_id,
                    type=NotificationType.PROJECT_DEADLINE_APPROACHING,
                    title="Project Deadline Approaching",
                    message=f'Project "{project.name}" deadline is approaching ({target_date}).',
                    related_project_id=project.id,
                )
                db.add(notif)
                count += 1

        # Notify manager (creator) if not already notified as team leader
        if project.created_by:
            # Check if the manager is already a team leader for this project (to avoid duplicate)
            is_manager_also_leader = any(
                m.user_id == project.created_by and m.role == MemberRole.TEAM_LEADER
                for m in project.members
            )
            if not is_manager_also_leader:
                already = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == project.created_by,
                        Notification.type == NotificationType.PROJECT_DEADLINE_APPROACHING,
                        Notification.related_project_id == project.id,
                    )
                    .first()
                )
                if already:
                    continue

                notif = Notification(
                    user_id=project.created_by,
                    type=NotificationType.PROJECT_DEADLINE_APPROACHING,
                    title="Project Deadline Approaching",
                    message=f'Project "{project.name}" deadline is approaching ({target_date}).',
                    related_project_id=project.id,
                )
                db.add(notif)
                count += 1

    if count:
        db.commit()
        logger.info("Project deadline worker: created %d notifications for %s", count, target_date)

    return count


def check_overdue_tasks(db: Session) -> int:
    """
    Create TASK_OVERDUE notifications for tasks past due date
    that do not already have an overdue notification for today.
    Returns the number of notifications created.
    """
    today = date.today()
    count = 0

    tasks = (
        db.query(Task)
        .options(
            joinedload(Task.story).joinedload(UserStory.project),
        )
        .filter(
            Task.due_date < today,
            Task.assigned_to.isnot(None),
            Task.status != TaskStatus.DONE,
        )
        .all()
    )

    for task in tasks:
        # Avoid duplicate notifications for the same day
        already = (
            db.query(Notification)
            .filter(
                Notification.user_id == task.assigned_to,
                Notification.type == NotificationType.TASK_OVERDUE,
                Notification.related_task_id == task.id,
            )
            .first()
        )
        if already:
            continue

        project_name = (
            task.story.project.name if task.story and task.story.project else "your project"
        )

        notif = Notification(
            user_id=task.assigned_to,
            type=NotificationType.TASK_OVERDUE,
            title="Task Overdue",
            message=f'Task "{task.title}" in project "{project_name}" is overdue (due {task.due_date}).',
            related_project_id=task.story.project_id if task.story else None,
            related_task_id=task.id,
            related_story_id=task.story_id,
        )
        db.add(notif)
        count += 1

    if count:
        db.commit()
        logger.info("Overdue task worker: created %d notifications for %s", count, today)

    return count


async def run_due_date_worker():
    """Async loop that runs the checks every hour."""
    logger.info("Due-date notification worker started.")
    while True:
        try:
            db: Session = SessionLocal()
            try:
                # Run all checks
                due_soon = check_due_soon(db)
                project_deadlines = check_project_deadlines(db)
                overdue = check_overdue_tasks(db)
                total = due_soon + project_deadlines + overdue
                logger.info(
                    "Due-date check complete. Notifications created: %d (due_soon: %d, project_deadlines: %d, overdue: %d)",
                    total,
                    due_soon,
                    project_deadlines,
                    overdue,
                )
            finally:
                db.close()
        except Exception as exc:
            logger.exception("Due-date worker encountered an error: %s", exc)

        # Sleep 1 hour before next run
        await asyncio.sleep(3600)
