from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from ..models.project import ProjectStatus, MemberRole, ProjectPriority
from .user import UserPublic


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.PLANNING
    priority: Optional[ProjectPriority] = None
    deadline: Optional[date] = None
    team_leader_id: Optional[int] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    deadline: Optional[date] = None
    comment: Optional[str] = None  # For review feedback (e.g., changes requested)


class ProjectMemberResponse(BaseModel):
    id: int
    user: UserPublic
    role: MemberRole
    joined_at: datetime

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: ProjectStatus
    priority: Optional[ProjectPriority] = None
    deadline: Optional[date] = None
    created_by: int
    created_by_user: UserPublic
    created_at: datetime
    updated_at: datetime
    members: List[ProjectMemberResponse] = []
    # computed fields added dynamically
    total_stories: Optional[int] = 0
    total_tasks: Optional[int] = 0
    completed_tasks: Optional[int] = 0
    progress: Optional[float] = 0.0

    model_config = {"from_attributes": True}


class ProjectSummary(BaseModel):
    id: int
    name: str
    description: Optional[str]
    status: ProjectStatus
    priority: Optional[ProjectPriority] = None
    deadline: Optional[date] = None
    created_at: datetime
    total_stories: int = 0
    total_tasks: int = 0
    completed_tasks: int = 0
    progress: float = 0.0
    member_count: int = 0

    model_config = {"from_attributes": True}


class AddMemberRequest(BaseModel):
    user_id: int
    role: MemberRole = MemberRole.MEMBER


class UpdateMemberRoleRequest(BaseModel):
    role: MemberRole
