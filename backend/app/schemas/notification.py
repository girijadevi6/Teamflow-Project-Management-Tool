from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from ..models.notification import NotificationType


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: NotificationType
    title: str
    message: str
    is_read: bool
    related_project_id: Optional[int]
    related_task_id: Optional[int]
    related_story_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


class NotificationMarkRead(BaseModel):
    notification_ids: list[int]
