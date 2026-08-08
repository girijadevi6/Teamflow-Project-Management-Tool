from sqlalchemy.orm import Session, joinedload
from datetime import date
from typing import List

from ..models.user import User, UserRole
from ..models.project import Project, ProjectMember
from ..models.story import UserStory
from ..models.task import Task, TaskStatus
from ..models.comment import Comment
from ..models.time_log import TimeLog


def build_authorized_live_context(db: Session, current_user: User) -> str:
    """
    Builds a secure context representation of all live database objects 
    the current_user is explicitly authorized to access.
    
    Security & Scope Rules:
    - Managers can see all projects in the database.
    - Team Leaders & Members can ONLY see projects where they are in ProjectMember.
    - Information for any other project outside this scope is omitted completely.
    """
    today = date.today()

    # 1. Fetch authorized projects
    if current_user.role == UserRole.MANAGER:
        projects = (
            db.query(Project)
            .options(
                joinedload(Project.members).joinedload(ProjectMember.user),
                joinedload(Project.stories).joinedload(UserStory.tasks).joinedload(Task.assignee),
                joinedload(Project.stories).joinedload(UserStory.tasks).joinedload(Task.creator),
            )
            .all()
        )
    else:
        memberships = (
            db.query(ProjectMember)
            .filter(ProjectMember.user_id == current_user.id)
            .all()
        )
        project_ids = [m.project_id for m in memberships]
        projects = (
            db.query(Project)
            .options(
                joinedload(Project.members).joinedload(ProjectMember.user),
                joinedload(Project.stories).joinedload(UserStory.tasks).joinedload(Task.assignee),
                joinedload(Project.stories).joinedload(UserStory.tasks).joinedload(Task.creator),
            )
            .filter(Project.id.in_(project_ids))
            .all()
        )

    authorized_project_names = [p.name for p in projects]

    lines: List[str] = []
    lines.append(f"AUTHENTICATED USER DETAILS:")
    lines.append(f"- User ID: {current_user.id}")
    lines.append(f"- Name: {current_user.name}")
    lines.append(f"- Email: {current_user.email}")
    lines.append(f"- System Role: {current_user.role.value}")
    lines.append(f"- Today's Date: {today.isoformat()}")
    lines.append(f"- Authorized Project Names: {', '.join(authorized_project_names) if authorized_project_names else 'None'}")
    lines.append("")

    if not projects:
        lines.append("No authorized projects found for this user.")
        return "\n".join(lines)

    lines.append("AUTHORIZED PROJECTS & TASK DATA:")

    all_authorized_tasks: List[Task] = []

    for p in projects:
        # Calculate statistics
        stories = p.stories or []
        tasks_in_project: List[Task] = []
        for s in stories:
            tasks_in_project.extend(s.tasks or [])

        all_authorized_tasks.extend(tasks_in_project)

        total_tasks = len(tasks_in_project)
        completed_tasks = sum(1 for t in tasks_in_project if t.status == TaskStatus.DONE)
        in_progress_tasks = sum(1 for t in tasks_in_project if t.status == TaskStatus.IN_PROGRESS)
        overdue_tasks = sum(
            1 for t in tasks_in_project
            if t.due_date and t.due_date < today and t.status != TaskStatus.DONE
        )
        progress = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        member_list = [f"{m.user.name} ({m.role.value})" for m in p.members if m.user]

        lines.append(f"Project ID {p.id}: '{p.name}'")
        lines.append(f"  - Description: {p.description or 'None'}")
        lines.append(f"  - Status: {p.status.value}, Priority: {p.priority.value}, Deadline: {p.deadline or 'Not set'}")
        lines.append(f"  - Members: {', '.join(member_list) if member_list else 'None'}")
        lines.append(f"  - Progress: {progress}% ({completed_tasks}/{total_tasks} tasks done, {in_progress_tasks} in progress, {overdue_tasks} overdue)")

        if stories:
            lines.append("  - User Stories:")
            for s in stories:
                lines.append(f"    * Story ID {s.id}: '{s.title}' (Status: {s.status.value}, Priority: {s.priority.value})")
                for t in s.tasks or []:
                    assignee_name = t.assignee.name if t.assignee else "Unassigned"
                    due_str = t.due_date.isoformat() if t.due_date else "No due date"
                    is_overdue = " [OVERDUE]" if t.due_date and t.due_date < today and t.status != TaskStatus.DONE else ""
                    is_my_task = " [ASSIGNED TO CURRENT USER]" if t.assigned_to == current_user.id else ""
                    lines.append(
                        f"      - Task ID {t.id}: '{t.title}' | Status: {t.status.value} | Priority: {t.priority.value} | Assignee: {assignee_name} | Due: {due_str}{is_overdue}{is_my_task} | Story Points: {t.story_points} | Logged Hours: {t.logged_hours}h / Est: {t.estimated_hours or 0}h"
                    )

        lines.append("")

    # Recent Comments on Authorized Tasks
    task_ids = [t.id for t in all_authorized_tasks]
    if task_ids:
        recent_comments = (
            db.query(Comment)
            .options(joinedload(Comment.user), joinedload(Comment.task))
            .filter(Comment.task_id.in_(task_ids))
            .order_by(Comment.created_at.desc())
            .limit(15)
            .all()
        )
        if recent_comments:
            lines.append("RECENT TASK COMMENTS & DISCUSSIONS:")
            for c in recent_comments:
                author = c.user.name if c.user else "Unknown"
                task_title = c.task.title if c.task else f"Task #{c.task_id}"
                lines.append(f"- Task '{task_title}' (ID {c.task_id}) | By {author} at {c.created_at.strftime('%Y-%m-%d %H:%M')}: \"{c.content}\"")
            lines.append("")

        # Recent Time Logs
        recent_time_logs = (
            db.query(TimeLog)
            .options(joinedload(TimeLog.user), joinedload(TimeLog.task))
            .filter(TimeLog.task_id.in_(task_ids))
            .order_by(TimeLog.logged_at.desc())
            .limit(15)
            .all()
        )
        if recent_time_logs:
            lines.append("RECENT TIME LOGS:")
            for tl in recent_time_logs:
                logger_name = tl.user.name if tl.user else "Unknown"
                task_title = tl.task.title if tl.task else f"Task #{tl.task_id}"
                lines.append(f"- Task '{task_title}' (ID {tl.task_id}) | {tl.hours} hours logged by {logger_name} on {tl.logged_at.strftime('%Y-%m-%d')}: {tl.description or 'No notes'}")
            lines.append("")

    return "\n".join(lines)
