from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .user import UserPublic


class ActivityLogResponse(BaseModel):
    id: int
    project_id: Optional[int]
    user: UserPublic
    action: str
    entity_type: str
    entity_id: Optional[int]
    entity_name: Optional[str]
    detail: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    pending_projects: int
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    urgent_tasks: int
    total_story_points: int
    completed_story_points: int
    my_assigned_tasks: int
    recent_activity: list[ActivityLogResponse] = []
