from pydantic import BaseModel, field_serializer
from typing import Optional
from datetime import datetime, timezone
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

    @field_serializer("created_at")
    def serialize_created_at(self, dt: datetime) -> str:
        """Always return UTC ISO-8601 string with Z suffix for correct frontend parsing."""
        if dt.tzinfo is None:
            # Naive datetime — treat as UTC
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


class NotificationMarkRead(BaseModel):
    notification_ids: list[int]
