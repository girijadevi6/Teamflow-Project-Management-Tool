from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from ..models.story import StoryStatus, Priority
from .user import UserPublic


class StoryCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    status: StoryStatus = StoryStatus.TODO


class StoryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[StoryStatus] = None


class TaskInStory(BaseModel):
    id: int
    title: str
    status: str
    priority: str
    assignee: Optional[UserPublic] = None
    due_date: Optional[date] = None
    story_points: int = 1

    model_config = {"from_attributes": True}


class StoryResponse(BaseModel):
    id: int
    project_id: int
    title: str
    description: Optional[str]
    priority: Priority
    status: StoryStatus
    created_by: int
    created_by_user: UserPublic
    created_at: datetime
    updated_at: datetime
    tasks: List[TaskInStory] = []
    total_tasks: int = 0
    completed_tasks: int = 0
    progress: float = 0.0

    model_config = {"from_attributes": True}


class StorySummary(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: Priority
    status: StoryStatus
    total_tasks: int = 0
    completed_tasks: int = 0
    progress: float = 0.0

    model_config = {"from_attributes": True}
