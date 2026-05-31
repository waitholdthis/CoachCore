from uuid import UUID
from datetime import datetime
from pydantic import BaseModel
from models.enums import Sport


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str
    sources: list["ChatSource"] = []
    timestamp: datetime | None = None


class ChatSource(BaseModel):
    rule_id: UUID
    canonical_text: str
    source_label: str  # e.g. "Springfield 2026 Rulebook p.14"
    rule_tier: str
    confidence: float


class ChatQuery(BaseModel):
    question: str
    sport: Sport | None = None
    age_bracket: str | None = None
    division_type: str | None = None
    league_id: UUID | None = None
    conversation_history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
    safety_notice: str | None = None
    ambiguity_notice: str | None = None
    scope_used: dict
    generated_at: datetime


ChatMessage.model_rebuild()
