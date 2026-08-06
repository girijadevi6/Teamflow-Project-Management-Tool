from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .user import UserPublic


class TimeLogCreate(BaseModel):
    hours: float
    description: Optional[str] = None


class TimeLogResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    hours: float
    description: Optional[str]
    logged_at: datetime
    user: UserPublic

    model_config = {"from_attributes": True}