from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from ..models.task import TaskStatus, Priority as TaskPriority
from ..models.story import StoryStatus, Priority as StoryPriority
from ..models.project import ProjectStatus
from .user import UserPublic


class TaskHierarchy(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: TaskPriority
    assignee: Optional[UserPublic]
    due_date: Optional[date]
    story_points: int

    model_config = {"from_attributes": True}


class StoryHierarchy(BaseModel):
    id: int
    title: str
    description: Optional[str]
    priority: StoryPriority
    status: StoryStatus
    tasks: List[TaskHierarchy] = []
    total_tasks: int = 0
    completed_tasks: int = 0
    progress: float = 0.0

    model_config = {"from_attributes": True}


class ProjectHierarchy(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: ProjectStatus
    stories: List[StoryHierarchy] = []
    total_tasks: int = 0
    completed_tasks: int = 0
    progress: float = 0.0

    model_config = {"from_attributes": True}
