from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from schemas.auth import UserRead


class TeamCreate(BaseModel):
    name: str
    sport: Optional[str] = None
    season_name: Optional[str] = None
    season_start: Optional[date] = None
    season_end: Optional[date] = None


class TeamRead(BaseModel):
    id: str
    name: str
    sport: Optional[str] = None
    season_name: Optional[str] = None
    season_start: Optional[date] = None
    season_end: Optional[date] = None
    invite_code: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeamMemberRead(BaseModel):
    id: str
    team_id: str
    user_id: str
    role: str
    child_names: List[str] = []
    is_approved: bool
    joined_at: datetime
    user: UserRead

    model_config = ConfigDict(from_attributes=True)


class MemberUpdate(BaseModel):
    is_approved: Optional[bool] = None
    role: Optional[str] = None
    child_names: Optional[List[str]] = None


class JoinRequest(BaseModel):
    invite_code: str


class TeamWithMeta(TeamRead):
    member_count: int
    my_role: str
