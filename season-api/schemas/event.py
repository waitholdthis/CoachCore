from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from schemas.auth import UserRead


class EventCreate(BaseModel):
    title: str
    event_type: str = "practice"
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    notes: Optional[str] = None


class EventRead(BaseModel):
    id: str
    team_id: str
    title: str
    event_type: str
    start_time: datetime
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    is_cancelled: bool
    created_by: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventUpdate(BaseModel):
    title: Optional[str] = None
    event_type: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    is_cancelled: Optional[bool] = None


class RSVPCreate(BaseModel):
    status: str  # yes/no/maybe
    note: Optional[str] = None


class RSVPRead(BaseModel):
    id: str
    event_id: str
    user_id: str
    status: str
    note: Optional[str] = None
    updated_at: datetime
    user: UserRead

    model_config = ConfigDict(from_attributes=True)


class EventWithRSVPs(EventRead):
    rsvps: List[RSVPRead] = []
    yes_count: int = 0
    no_count: int = 0
    maybe_count: int = 0
    my_rsvp: Optional[RSVPRead] = None
