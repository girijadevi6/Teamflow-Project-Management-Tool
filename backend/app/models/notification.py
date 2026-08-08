from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum

from ..database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class NotificationType(str, enum.Enum):
    TASK_ASSIGNED = "TASK_ASSIGNED"
    TASK_STATUS_CHANGED = "TASK_STATUS_CHANGED"
    TASK_DUE_SOON = "TASK_DUE_SOON"
    TASK_OVERDUE = "TASK_OVERDUE"
    STORY_COMPLETED = "STORY_COMPLETED"
    PROJECT_ADDED = "PROJECT_ADDED"
    PROJECT_STATUS_CHANGED = "PROJECT_STATUS_CHANGED"
    PROJECT_DEADLINE_APPROACHING = "PROJECT_DEADLINE_APPROACHING"
    COMMENT_ADDED = "COMMENT_ADDED"
    TASK_COMMENTED = "TASK_COMMENTED"
    TASK_UNASSIGNED = "TASK_UNASSIGNED"
    TASK_SUBMITTED_FOR_REVIEW = "TASK_SUBMITTED_FOR_REVIEW"
    TASK_CHANGES_REQUESTED = "TASK_CHANGES_REQUESTED"
    TASK_APPROVED = "TASK_APPROVED"
    PROJECT_SUBMITTED_FOR_REVIEW = "PROJECT_SUBMITTED_FOR_REVIEW"
    PROJECT_CHANGES_REQUESTED = "PROJECT_CHANGES_REQUESTED"
    PROJECT_COMPLETED = "PROJECT_COMPLETED"
    DAILY_DIGEST = "DAILY_DIGEST"
    URGENT_TASK_ASSIGNED = "URGENT_TASK_ASSIGNED"
    TASK_URGENT_DUE = "TASK_URGENT_DUE"
    URGENT_TASK_DUE_SOON = "URGENT_TASK_DUE_SOON"


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(SAEnum(NotificationType), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    related_project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    related_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    related_story_id = Column(Integer, ForeignKey("user_stories.id"), nullable=True)
    created_at = Column(DateTime, default=_utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")
