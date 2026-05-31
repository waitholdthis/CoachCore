from pydantic import BaseModel, ConfigDict
from typing import Any
from datetime import datetime


class PracticePlanGenerate(BaseModel):
    sport: str
    age_bracket: str
    focus_area: str
    duration_minutes: int = 90
    division_type: str | None = None
    league_id: str | None = None
    additional_context: str | None = None


class PracticePlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    sport: str
    age_bracket: str
    division_type: str | None
    league_id: str | None
    title: str
    overview: str
    focus_area: str
    duration_minutes: int
    phases: list[Any]
    equipment_list: list[Any]
    safety_notes: list[Any]
    coaching_cues: list[Any]
    generation_params: dict | None
    created_at: datetime


class SCProgramGenerate(BaseModel):
    sport: str
    age_bracket: str
    season_phase: str = "off_season"  # off_season | pre_season | in_season | post_season
    weeks: int = 4
    days_per_week: int = 3
    league_id: str | None = None
    goals: str | None = None


class SCProgramRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    sport: str
    age_bracket: str
    ltad_stage: str
    season_phase: str
    weeks: int
    days_per_week: int
    title: str
    overview: str
    safety_constraints: list[Any]
    macrocycle: list[Any]
    generation_params: dict | None
    created_at: datetime


class GamePlanCreate(BaseModel):
    sport: str
    age_bracket: str
    league_id: str | None = None
    title: str
    opponent_name: str | None = None
    formation: str | None = None
    field_positions: list[Any] = []
    tactical_notes: str | None = None
    set_pieces: list[Any] = []


class GamePlanUpdate(BaseModel):
    title: str | None = None
    opponent_name: str | None = None
    formation: str | None = None
    field_positions: list[Any] | None = None
    tactical_notes: str | None = None
    set_pieces: list[Any] | None = None


class GamePlanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    sport: str
    age_bracket: str
    league_id: str | None
    title: str
    opponent_name: str | None
    formation: str | None
    field_positions: list[Any]
    tactical_notes: str | None
    set_pieces: list[Any]
    key_rules_context: list[Any]
    created_at: datetime
    updated_at: datetime


class LTADStageResponse(BaseModel):
    stage_name: str
    age_brackets: list[str]
    focus: str
    key_components: list[str]
    prohibited: list[str]
    sc_guidelines: str
    max_session_minutes: int
    max_sessions_per_week: int
    intensity_ceiling: str
    notes: str
    sport_constraints: list[str]
