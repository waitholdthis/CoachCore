from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from models.enums import Sport, ConflictType, ConflictResolution
from schemas.rule import RuleRead


class ConflictRecordRead(BaseModel):
    id: UUID
    league_id: UUID
    sport: Sport
    conflict_type: ConflictType
    effective_scope: dict
    baseline_rule: RuleRead
    local_rule: RuleRead
    similarity_score: float | None = None
    classification_confidence: float | None = None
    resolution: ConflictResolution
    coach_flag: bool
    flag_message: str | None = None
    safety_critical: bool
    verified_by_admin: bool
    admin_notes: str | None = None
    created_at: datetime
    resolved_at: datetime | None = None

    model_config = {"from_attributes": True}


class ConflictResolve(BaseModel):
    resolution: ConflictResolution
    admin_notes: str | None = None


class ConflictSummary(BaseModel):
    league_id: UUID
    total: int
    pending_review: int
    safety_critical: int
    local_overrides: int
    by_category: dict[str, int] = {}
