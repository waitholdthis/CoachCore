import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, Float, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
from models.enums import Sport, ConflictType, ConflictResolution


class ConflictRecord(Base):
    __tablename__ = "conflict_records"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    league_id = Column(UUID(as_uuid=True), ForeignKey("leagues.id"), nullable=False, index=True)
    sport = Column(SAEnum(Sport), nullable=False, index=True)

    conflict_type = Column(SAEnum(ConflictType), nullable=False)
    # Effective scope of the conflict: {age_brackets, division_types, temporal_qualifier}
    effective_scope = Column(JSON, nullable=False, default=dict)

    baseline_rule_id = Column(UUID(as_uuid=True), ForeignKey("rules.id"), nullable=False)
    local_rule_id = Column(UUID(as_uuid=True), ForeignKey("rules.id"), nullable=False)

    similarity_score = Column(Float, nullable=True)
    classification_confidence = Column(Float, nullable=True)

    resolution = Column(
        SAEnum(ConflictResolution),
        nullable=False,
        default=ConflictResolution.pending_review,
        index=True,
    )

    coach_flag = Column(Boolean, nullable=False, default=True)
    flag_message = Column(Text, nullable=True)
    safety_critical = Column(Boolean, nullable=False, default=False, index=True)

    verified_by_admin = Column(Boolean, nullable=False, default=False)
    admin_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    league = relationship("League", back_populates="conflicts")
    baseline_rule = relationship("Rule", back_populates="conflicts_as_baseline", foreign_keys=[baseline_rule_id])
    local_rule = relationship("Rule", back_populates="conflicts_as_local", foreign_keys=[local_rule_id])

    def __repr__(self) -> str:
        return f"<ConflictRecord {self.conflict_type} [{self.sport}]>"
