import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ARRAY, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
from models.enums import Sport


class League(Base):
    __tablename__ = "leagues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    sport = Column(SAEnum(Sport), nullable=False, index=True)
    season = Column(String(50), nullable=True)
    governing_body = Column(String(200), nullable=True)

    age_brackets_served = Column(ARRAY(String), nullable=False, default=list)
    division_types_served = Column(ARRAY(String), nullable=False, default=list)

    contact_admin = Column(String(200), nullable=True)
    created_by = Column(String(200), nullable=True)

    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    uploads = relationship("RuleUpload", back_populates="league", cascade="all, delete-orphan")
    local_rules = relationship("Rule", back_populates="league", foreign_keys="Rule.league_id")
    conflicts = relationship("ConflictRecord", back_populates="league", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<League {self.name} [{self.sport}]>"
