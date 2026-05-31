import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
from models.enums import IngestionStatus


class RuleUpload(Base):
    __tablename__ = "rule_uploads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    league_id = Column(UUID(as_uuid=True), ForeignKey("leagues.id"), nullable=False, index=True)

    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(String(1000), nullable=False)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)

    ingestion_status = Column(
        SAEnum(IngestionStatus),
        nullable=False,
        default=IngestionStatus.pending,
        index=True,
    )

    page_count = Column(Integer, nullable=True)
    rules_extracted = Column(Integer, nullable=False, default=0)
    conflict_count = Column(Integer, nullable=False, default=0)
    safety_flag_count = Column(Integer, nullable=False, default=0)
    ambiguous_rule_count = Column(Integer, nullable=False, default=0)
    ocr_confidence_avg = Column(Float, nullable=True)

    error_message = Column(Text, nullable=True)

    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    uploaded_by = Column(String(200), nullable=True)
    processing_started_at = Column(DateTime, nullable=True)
    processing_completed_at = Column(DateTime, nullable=True)

    # Relationships
    league = relationship("League", back_populates="uploads")
    extracted_rules = relationship("Rule", back_populates="upload", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<RuleUpload {self.original_filename} [{self.ingestion_status}]>"
