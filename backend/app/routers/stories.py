from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import List

from ..database import get_db
from ..dependencies import get_current_user, require_manager_or_leader
from ..models.user import User, UserRole
from ..models.project import Project, ProjectMember
from ..models.story import UserStory, StoryStatus
from ..models.task import TaskStatus
from ..schemas.story import StoryCreate, StoryUpdate, StoryResponse
from ..services.notification_service import notify_story_completed
from ..services.activity_service import log_activity

router = APIRouter(tags=["User Stories"])


def _story_stats(story: UserStory) -> dict:
    total = len(story.tasks)
    done = sum(1 for t in story.tasks if t.status == TaskStatus.DONE)
    return {
        "total_tasks": total,
        "completed_tasks": done,
        "progress": round(done / total * 100, 1) if total else 0.0,
    }


def _build_story_response(story: UserStory) -> StoryResponse:
    stats = _story_stats(story)
    resp = StoryResponse.model_validate(story)
    resp.total_tasks = stats["total_tasks"]
    resp.completed_tasks = stats["completed_tasks"]
    resp.progress = stats["progress"]
    return resp


def _assert_project_member(project: Project, user: User):
    if user.role == UserRole.MANAGER:
        return  # Managers have full access to all projects
    is_member = any(m.user_id == user.id for m in project.members)
    if not is_member:
        raise HTTPException(status_code=403, detail="Access denied: not a project member")


@router.post(
    "/projects/{project_id}/stories",
    response_model=StoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_story(
    project_id: int,
    payload: StoryCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_leader),
):
    project = (
        db.query(Project)
        .options(joinedload(Project.members))
        .filter(Project.id == project_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    _assert_project_member(project, current_user)

    story = UserStory(
        project_id=project_id,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=payload.status,
        created_by=current_user.id,
    )
    db.add(story)
    db.commit()
    db.refresh(story)

    background_tasks.add_task(
        log_activity, db, current_user.id, "created_story", "story",
        story.id, story.title, project_id,
    )

    return _build_story_response(story)


@router.get("/projects/{project_id}/stories", response_model=List[StoryResponse])
def list_stories(
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
    _assert_project_member(project, current_user)

    stories = (
        db.query(UserStory)
        .options(
            joinedload(UserStory.tasks).joinedload(UserStory.tasks.property.mapper.class_.assignee),
            joinedload(UserStory.created_by_user),
        )
        .filter(UserStory.project_id == project_id)
        .all()
    )
    return [_build_story_response(s) for s in stories]


@router.get("/stories/{story_id}", response_model=StoryResponse)
def get_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    story = (
        db.query(UserStory)
        .options(
            joinedload(UserStory.tasks),
            joinedload(UserStory.created_by_user),
            joinedload(UserStory.project).joinedload(Project.members),
        )
        .filter(UserStory.id == story_id)
        .first()
    )
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    _assert_project_member(story.project, current_user)
    return _build_story_response(story)


@router.put("/stories/{story_id}", response_model=StoryResponse)
def update_story(
    story_id: int,
    payload: StoryUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_leader),
):
    story = (
        db.query(UserStory)
        .options(
            joinedload(UserStory.project).joinedload(Project.members),
            joinedload(UserStory.tasks),
        )
        .filter(UserStory.id == story_id)
        .first()
    )
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    _assert_project_member(story.project, current_user)

    old_status = story.status

    if payload.title is not None:
        story.title = payload.title
    if payload.description is not None:
        story.description = payload.description
    if payload.priority is not None:
        story.priority = payload.priority
    if payload.status is not None:
        story.status = payload.status

    db.commit()
    db.refresh(story)

    if old_status != StoryStatus.DONE and story.status == StoryStatus.DONE:
        background_tasks.add_task(notify_story_completed, db, story, current_user)

    background_tasks.add_task(
        log_activity, db, current_user.id, "updated_story", "story",
        story.id, story.title, story.project_id,
        f"Status: {old_status} → {story.status}",
    )

    return _build_story_response(story)


@router.delete("/stories/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager_or_leader),
):
    story = (
        db.query(UserStory)
        .options(joinedload(UserStory.project).joinedload(Project.members))
        .filter(UserStory.id == story_id)
        .first()
    )
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    _assert_project_member(story.project, current_user)
    db.delete(story)
    db.commit()
