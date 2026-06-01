from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import text
from database import Base


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    title = Column(String(200), nullable=False)
    event_type = Column(String(20), nullable=False, server_default="practice")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    location = Column(String(300), nullable=True)
    sport = Column(String(50), nullable=True)
    age_bracket = Column(String(20), nullable=True)
    team_name = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    linked_plan_id = Column(UUID(as_uuid=False), ForeignKey("practice_plans.id", ondelete="SET NULL"), nullable=True)
    is_completed = Column(Boolean, nullable=False, server_default=text("false"))
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))


class Season(Base):
    __tablename__ = "seasons"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    title = Column(String(200), nullable=False)
    sport = Column(String(50), nullable=False)
    age_bracket = Column(String(20), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_weeks = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    goals = Column(JSONB, nullable=False, server_default=text("'[]'"))
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))


class SeasonWeek(Base):
    __tablename__ = "season_weeks"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    season_id = Column(UUID(as_uuid=False), ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False)
    week_number = Column(Integer, nullable=False)
    theme = Column(String(200), nullable=True)
    focus_skills = Column(JSONB, nullable=False, server_default=text("'[]'"))
    linked_plan_id = Column(UUID(as_uuid=False), ForeignKey("practice_plans.id", ondelete="SET NULL"), nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))
