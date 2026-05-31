from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from uuid import UUID
from schemas.auth import UserRead


class MessageCreate(BaseModel):
    content: str
    attachment_key: Optional[str] = None
    attachment_type: Optional[str] = None


class MessageRead(BaseModel):
    id: str
    channel_id: str
    sender_id: str
    content: str
    is_deleted: bool
    edited_at: Optional[datetime] = None
    attachment_key: Optional[str] = None
    attachment_type: Optional[str] = None
    created_at: datetime
    sender: UserRead

    model_config = ConfigDict(from_attributes=True)


class MessageEdit(BaseModel):
    content: str


class ChannelRead(BaseModel):
    id: str
    team_id: str
    channel_type: str
    name: Optional[str] = None
    dm_user1_id: Optional[str] = None
    dm_user2_id: Optional[str] = None
    is_archived: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChannelWithMeta(ChannelRead):
    unread_count: int = 0
    last_message: Optional[MessageRead] = None
    other_user: Optional[UserRead] = None


class DMRequest(BaseModel):
    target_user_id: UUID
