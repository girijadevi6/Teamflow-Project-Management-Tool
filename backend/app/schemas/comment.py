from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .user import UserPublic


class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentResponse(BaseModel):
    id: int
    task_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    user: UserPublic

    model_config = {"from_attributes": True}