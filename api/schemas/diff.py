from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from models.enums import Sport


class DiffContext(BaseModel):
    sport: Sport
    age_bracket: str
    division_type: str = "all"
    league_id: UUID | None = None
    label: str  # e.g. "Springfield Hoops 2026" or "Metro Classic Tournament"


class DiffEntry(BaseModel):
    category: str
    subcategory: str | None = None
    diff_type: str  # MORE_RESTRICTIVE | MORE_PERMISSIVE | FUNDAMENTALLY_DIFFERENT | MISSING_IN_AWAY | MISSING_IN_HOME
    severity_score: float  # 0.0–1.0
    safety_critical: bool = False
    home_rule_text: str | None = None
    home_rule_source: str | None = None
    away_rule_text: str | None = None
    away_rule_source: str | None = None
    key_difference: str | None = None


class RuleDiff(BaseModel):
    home: DiffContext
    away: DiffContext
    entries: list[DiffEntry]
    total_differences: int
    safety_critical_differences: int
    generated_at: datetime


class DiffRequest(BaseModel):
    home: DiffContext
    away: DiffContext
