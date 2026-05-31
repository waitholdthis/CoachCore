from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from models.enums import Sport


class LeagueBase(BaseModel):
    name: str
    sport: Sport
    season: str | None = None
    governing_body: str | None = None
    age_brackets_served: list[str] = []
    division_types_served: list[str] = []
    contact_admin: str | None = None


class LeagueCreate(LeagueBase):
    created_by: str | None = None


class LeagueRead(LeagueBase):
    id: UUID
    created_by: str | None = None
    created_at: datetime
    updated_at: datetime
    upload_count: int = 0
    conflict_count: int = 0

    model_config = {"from_attributes": True}


class LeagueUpdate(BaseModel):
    name: str | None = None
    season: str | None = None
    governing_body: str | None = None
    age_brackets_served: list[str] | None = None
    division_types_served: list[str] | None = None
    contact_admin: str | None = None


class UploadRead(BaseModel):
    id: UUID
    league_id: UUID
    original_filename: str
    ingestion_status: str
    page_count: int | None = None
    rules_extracted: int = 0
    conflict_count: int = 0
    safety_flag_count: int = 0
    ambiguous_rule_count: int = 0
    ocr_confidence_avg: float | None = None
    error_message: str | None = None
    uploaded_at: datetime
    processing_completed_at: datetime | None = None

    model_config = {"from_attributes": True}
