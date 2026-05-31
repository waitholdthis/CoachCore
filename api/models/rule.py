import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, DateTime, Text,
    ForeignKey, ARRAY, JSON, Enum as SAEnum, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from database import Base
from models.enums import Sport, RuleTier, RuleType


class Rule(Base):
    __tablename__ = "rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sport = Column(SAEnum(Sport), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100), nullable=True, index=True)
    rule_tier = Column(SAEnum(RuleTier), nullable=False, default=RuleTier.baseline, index=True)
    rule_type = Column(SAEnum(RuleType), nullable=False, default=RuleType.prose)

    canonical_text = Column(Text, nullable=False)
    plain_language_text = Column(Text, nullable=True)

    # Scope stored as JSON: {age_brackets: [], division_types: [], league_levels: []}
    scope = Column(JSON, nullable=False, default=dict)

    safety_critical = Column(Boolean, nullable=False, default=False, index=True)
    game_day_critical = Column(Boolean, nullable=False, default=False, index=True)
    display_priority = Column(Integer, nullable=False, default=100)

    # For numeric rules (pitch counts, game lengths, etc.)
    numeric_value = Column(Float, nullable=True)
    numeric_unit = Column(String(50), nullable=True)

    governing_body_source = Column(String(200), nullable=True)
    effective_date = Column(DateTime, nullable=True)
    review_date = Column(DateTime, nullable=True)
    superseded_by_id = Column(UUID(as_uuid=True), ForeignKey("rules.id"), nullable=True)

    # For local rules — which league/upload they came from
    league_id = Column(UUID(as_uuid=True), ForeignKey("leagues.id"), nullable=True, index=True)
    upload_id = Column(UUID(as_uuid=True), ForeignKey("rule_uploads.id"), nullable=True)
    source_page = Column(Integer, nullable=True)
    source_paragraph = Column(String(50), nullable=True)

    # Vector embedding for semantic search (1536-dim for text-embedding-3-large at reduced dim)
    embedding = Column(Vector(1536), nullable=True)

    tags = Column(ARRAY(String), nullable=False, default=list)
    related_rule_ids = Column(ARRAY(UUID(as_uuid=True)), nullable=False, default=list)

    # Normative certainty: 0.0 (ambiguous) to 1.0 (mandatory/definitive)
    normative_certainty = Column(Float, nullable=True)
    human_resolved = Column(Boolean, nullable=False, default=False)
    human_resolution_choice = Column(String(50), nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    league = relationship("League", back_populates="local_rules", foreign_keys=[league_id])
    upload = relationship("RuleUpload", back_populates="extracted_rules")
    conflicts_as_baseline = relationship(
        "ConflictRecord",
        back_populates="baseline_rule",
        foreign_keys="ConflictRecord.baseline_rule_id",
    )
    conflicts_as_local = relationship(
        "ConflictRecord",
        back_populates="local_rule",
        foreign_keys="ConflictRecord.local_rule_id",
    )

    def __repr__(self) -> str:
        return f"<Rule {self.sport}/{self.category}/{self.subcategory} [{self.rule_tier}]>"


# IVFFlat index for fast approximate nearest-neighbor search
# Created in migration; declared here for documentation
# CREATE INDEX rules_embedding_idx ON rules USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
