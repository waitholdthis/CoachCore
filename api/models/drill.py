from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import text
from database import Base


class Drill(Base):
    __tablename__ = "drills"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    title = Column(String(200), nullable=False)
    sport = Column(String(50), nullable=False)
    skill_focus = Column(String(100), nullable=False)
    difficulty = Column(String(20), nullable=False, server_default="beginner")
    duration_minutes = Column(Integer, nullable=False, server_default=text("15"))
    player_count_min = Column(Integer, nullable=True)
    player_count_max = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    setup = Column(Text, nullable=True)
    instructions = Column(JSONB, nullable=False, server_default=text("'[]'"))
    coaching_points = Column(JSONB, nullable=False, server_default=text("'[]'"))
    progressions = Column(JSONB, nullable=False, server_default=text("'[]'"))
    equipment = Column(JSONB, nullable=False, server_default=text("'[]'"))
    tags = Column(JSONB, nullable=False, server_default=text("'[]'"))
    age_brackets = Column(JSONB, nullable=False, server_default=text("'[]'"))
    is_featured = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


class PracticeTemplate(Base):
    __tablename__ = "practice_templates"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    title = Column(String(200), nullable=False)
    sport = Column(String(50), nullable=False)
    age_bracket = Column(String(20), nullable=False)
    difficulty = Column(String(20), nullable=False, server_default="beginner")
    duration_minutes = Column(Integer, nullable=False, server_default=text("90"))
    player_count_min = Column(Integer, nullable=True)
    player_count_max = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    overview = Column(Text, nullable=True)
    phases = Column(JSONB, nullable=False, server_default=text("'[]'"))
    equipment_list = Column(JSONB, nullable=False, server_default=text("'[]'"))
    tags = Column(JSONB, nullable=False, server_default=text("'[]'"))
    is_featured = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
