from sqlalchemy import Column, String, Integer, Boolean, DateTime, Text, Float, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import text
from database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    number = Column(Integer, nullable=True)
    position = Column(String(100), nullable=True)
    age = Column(Integer, nullable=True)
    sport = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    emergency_contact = Column(String(200), nullable=True)
    medical_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))


class RosterTeam(Base):
    __tablename__ = "roster_teams"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    name = Column(String(200), nullable=False)
    sport = Column(String(50), nullable=False)
    age_bracket = Column(String(20), nullable=False)
    season_label = Column(String(100), nullable=True)
    head_coach = Column(String(200), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
    updated_at = Column(DateTime, nullable=False, server_default=text("now()"))


class RosterTeamPlayer(Base):
    __tablename__ = "roster_team_players"
    __table_args__ = (UniqueConstraint("team_id", "player_id", name="uq_roster_team_player"),)

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    team_id = Column(UUID(as_uuid=False), ForeignKey("roster_teams.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(UUID(as_uuid=False), ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    joined_at = Column(DateTime, nullable=False, server_default=text("now()"))


class PerformanceRecord(Base):
    __tablename__ = "performance_records"

    id = Column(UUID(as_uuid=False), primary_key=True, server_default=text("uuid_generate_v4()"))
    player_id = Column(UUID(as_uuid=False), ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    recorded_at = Column(DateTime, nullable=False, server_default=text("now()"))
    sport = Column(String(50), nullable=True)
    metric_type = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=True)
    context = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=text("now()"))
