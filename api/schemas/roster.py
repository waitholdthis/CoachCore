from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Any


class PlayerCreate(BaseModel):
    first_name: str
    last_name: str
    number: int | None = None
    position: str | None = None
    age: int | None = None
    sport: str | None = None
    notes: str | None = None
    emergency_contact: str | None = None
    medical_notes: str | None = None


class PlayerUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    number: int | None = None
    position: str | None = None
    age: int | None = None
    sport: str | None = None
    notes: str | None = None
    emergency_contact: str | None = None
    medical_notes: str | None = None


class PlayerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    first_name: str
    last_name: str
    number: int | None
    position: str | None
    age: int | None
    sport: str | None
    notes: str | None
    emergency_contact: str | None
    medical_notes: str | None
    created_at: datetime
    updated_at: datetime


class RosterTeamCreate(BaseModel):
    name: str
    sport: str
    age_bracket: str
    season_label: str | None = None
    head_coach: str | None = None


class RosterTeamUpdate(BaseModel):
    name: str | None = None
    sport: str | None = None
    age_bracket: str | None = None
    season_label: str | None = None
    head_coach: str | None = None


class RosterTeamRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    sport: str
    age_bracket: str
    season_label: str | None
    head_coach: str | None
    created_at: datetime
    updated_at: datetime


class RosterTeamWithPlayers(RosterTeamRead):
    players: list[PlayerRead] = []


class PerformanceRecordCreate(BaseModel):
    player_id: str
    sport: str | None = None
    metric_type: str
    value: float
    unit: str | None = None
    context: str | None = None
    notes: str | None = None
    recorded_at: datetime | None = None


class PerformanceRecordRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    player_id: str
    recorded_at: datetime
    sport: str | None
    metric_type: str
    value: float
    unit: str | None
    context: str | None
    notes: str | None
    created_at: datetime
