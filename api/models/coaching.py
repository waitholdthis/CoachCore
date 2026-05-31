from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import text
from database import Base


class PracticePlan(Base):
    __tablename__ = "practice_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    sport = Column(String(50), nullable=False)
    age_bracket = Column(String(20), nullable=False)
    division_type = Column(String(50), nullable=True)
    league_id = Column(UUID(as_uuid=True), nullable=True)
    title = Column(String(300), nullable=False)
    overview = Column(Text, nullable=False)
    focus_area = Column(String(200), nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    phases = Column(JSONB, nullable=False, server_default=text("'[]'"))
    equipment_list = Column(JSONB, nullable=False, server_default=text("'[]'"))
    safety_notes = Column(JSONB, nullable=False, server_default=text("'[]'"))
    coaching_cues = Column(JSONB, nullable=False, server_default=text("'[]'"))
    generation_params = Column(JSONB, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


class SCProgram(Base):
    __tablename__ = "sc_programs"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    sport = Column(String(50), nullable=False)
    age_bracket = Column(String(20), nullable=False)
    ltad_stage = Column(String(100), nullable=False)
    season_phase = Column(String(50), nullable=False)
    weeks = Column(Integer, nullable=False)
    days_per_week = Column(Integer, nullable=False)
    title = Column(String(300), nullable=False)
    overview = Column(Text, nullable=False)
    safety_constraints = Column(JSONB, nullable=False, server_default=text("'[]'"))
    macrocycle = Column(JSONB, nullable=False, server_default=text("'[]'"))
    generation_params = Column(JSONB, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))


class GamePlan(Base):
    __tablename__ = "game_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("uuid_generate_v4()"))
    sport = Column(String(50), nullable=False)
    age_bracket = Column(String(20), nullable=False)
    league_id = Column(UUID(as_uuid=True), nullable=True)
    title = Column(String(300), nullable=False)
    opponent_name = Column(String(200), nullable=True)
    formation = Column(String(50), nullable=True)
    field_positions = Column(JSONB, nullable=False, server_default=text("'[]'"))
    tactical_notes = Column(Text, nullable=True)
    set_pieces = Column(JSONB, nullable=False, server_default=text("'[]'"))
    key_rules_context = Column(JSONB, nullable=False, server_default=text("'[]'"))
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))
