from __future__ import annotations
from uuid import UUID
from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field
from models.enums import Sport, RuleTier, RuleType


class RuleScope(BaseModel):
    age_brackets: list[str] = ["all"]
    division_types: list[str] = ["all"]
    league_levels: list[str] = ["all"]
    temporal_qualifier: str | None = None


class RuleBase(BaseModel):
    sport: Sport
    category: str
    subcategory: str | None = None
    rule_tier: RuleTier = RuleTier.baseline
    rule_type: RuleType = RuleType.prose
    canonical_text: str
    plain_language_text: str | None = None
    scope: RuleScope = Field(default_factory=RuleScope)
    safety_critical: bool = False
    game_day_critical: bool = False
    display_priority: int = 100
    numeric_value: float | None = None
    numeric_unit: str | None = None
    governing_body_source: str | None = None
    tags: list[str] = []
    normative_certainty: float | None = None


class RuleCreate(RuleBase):
    league_id: UUID | None = None
    upload_id: UUID | None = None
    source_page: int | None = None
    source_paragraph: str | None = None


class RuleRead(RuleBase):
    id: UUID
    league_id: UUID | None = None
    upload_id: UUID | None = None
    source_page: int | None = None
    source_paragraph: str | None = None
    human_resolved: bool = False
    human_resolution_choice: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ActiveRule(RuleRead):
    provenance_tier: RuleTier
    provenance_source: str
    overridden_by_local: bool = False


class QuickRefCard(BaseModel):
    sport: Sport
    age_bracket: str
    league_id: UUID | None = None
    league_name: str | None = None
    tier_1: list[ActiveRule]
    tier_2: list[ActiveRule]
    local_override_count: int = 0
    local_overrides: list[ActiveRule] = []
    safety_flags: list[ActiveRule] = []
    generated_at: datetime
    share_token: str | None = None


class RuleResolveParams(BaseModel):
    sport: Sport
    age_bracket: str
    division_type: str = "all"
    league_id: UUID | None = None
    tournament_id: UUID | None = None
