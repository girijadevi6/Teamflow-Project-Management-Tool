from pydantic import BaseModel
from typing import Optional, Union
from datetime import datetime, date
from ..models.task import TaskStatus, Priority
from .user import UserPublic


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: Priority = Priority.MEDIUM
    status: TaskStatus = TaskStatus.TODO
    assigned_to: Optional[int] = None
    due_date: Optional[Union[datetime, date, str]] = None
    story_points: int = 1
    estimated_hours: Optional[float] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[Priority] = None
    status: Optional[TaskStatus] = None
    assigned_to: Optional[int] = None
    due_date: Optional[Union[datetime, date, str]] = None
    story_points: Optional[int] = None
    estimated_hours: Optional[float] = None


class TaskStatusUpdate(BaseModel):
    status: TaskStatus
    comment: Optional[str] = None  # For review feedback (e.g., changes requested)


class TaskAssignUpdate(BaseModel):
    assigned_to: Optional[int] = None  # None = unassign


class TaskResponse(BaseModel):
    id: int
    story_id: int
    title: str
    description: Optional[str]
    status: TaskStatus
    priority: Priority
    assigned_to: Optional[int]
    assignee: Optional[UserPublic] = None
    due_date: Optional[Union[datetime, date, str]] = None
    story_points: int
    estimated_hours: Optional[float] = None
    logged_hours: float = 0.0
    created_by: int
    creator: Optional[UserPublic] = None
    created_at: datetime
    updated_at: datetime
    # nested context
    story_title: Optional[str] = None
    project_id: Optional[int] = None
    project_name: Optional[str] = None

    model_config = {"from_attributes": True}
