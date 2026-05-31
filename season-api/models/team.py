from sqlalchemy import String, DateTime, Date, Boolean, Enum, UniqueConstraint, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime, date
from database import Base

MemberRoleEnum = Enum("parent", "coach", "admin", name="memberrole")


class Team(Base):
    __tablename__ = "season_teams"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    sport: Mapped[str | None] = mapped_column(String(100), nullable=True)
    season_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    season_start: Mapped[date | None] = mapped_column(Date, nullable=True)
    season_end: Mapped[date | None] = mapped_column(Date, nullable=True)
    invite_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    created_by: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_users.id"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("now()"), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("now()"), nullable=False
    )


class TeamMember(Base):
    __tablename__ = "season_team_members"
    __table_args__ = (UniqueConstraint("team_id", "user_id", name="uq_team_member"),)

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    team_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_teams.id"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_users.id"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(
        MemberRoleEnum,
        nullable=False,
        default="parent",
    )
    child_names: Mapped[list] = mapped_column(
        ARRAY(String),
        nullable=False,
        server_default=text("'{}'"),
    )
    is_approved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("now()"), nullable=False
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    approved_by: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_users.id"),
        nullable=True,
    )
