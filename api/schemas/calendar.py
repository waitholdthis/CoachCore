from pydantic import BaseModel, ConfigDict
from typing import Any
from datetime import datetime, date


class CalendarEventCreate(BaseModel):
    title: str
    event_type: str = "practice"  # practice|game|training|other
    start_time: datetime
    end_time: datetime | None = None
    location: str | None = None
    sport: str | None = None
    age_bracket: str | None = None
    team_name: str | None = None
    notes: str | None = None
    linked_plan_id: str | None = None


class CalendarEventUpdate(BaseModel):
    title: str | None = None
    event_type: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    location: str | None = None
    sport: str | None = None
    age_bracket: str | None = None
    team_name: str | None = None
    notes: str | None = None
    linked_plan_id: str | None = None
    is_completed: bool | None = None


class CalendarEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    event_type: str
    start_time: datetime
    end_time: datetime | None
    location: str | None
    sport: str | None
    age_bracket: str | None
    team_name: str | None
    notes: str | None
    linked_plan_id: str | None
    is_completed: bool
    created_at: datetime
    updated_at: datetime


class SeasonCreate(BaseModel):
    title: str
    sport: str
    age_bracket: str
    start_date: date
    end_date: date
    description: str | None = None
    goals: list[str] = []


class SeasonRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    sport: str
    age_bracket: str
    start_date: date
    end_date: date
    total_weeks: int
    description: str | None
    goals: list[Any]
    created_at: datetime
    updated_at: datetime


class SeasonWeekRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    season_id: str
    week_number: int
    theme: str | None
    focus_skills: list[Any]
    linked_plan_id: str | None
    notes: str | None
    updated_at: datetime


class SeasonWeekUpdate(BaseModel):
    theme: str | None = None
    focus_skills: list[str] | None = None
    linked_plan_id: str | None = None
    notes: str | None = None
