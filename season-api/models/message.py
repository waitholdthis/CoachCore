from sqlalchemy import String, DateTime, Boolean, Enum, Text, PrimaryKeyConstraint, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from database import Base

ChannelTypeEnum = Enum("team_chat", "announcements", "direct", name="channeltype")


class Channel(Base):
    __tablename__ = "season_channels"

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
    channel_type: Mapped[str] = mapped_column(ChannelTypeEnum, nullable=False)
    name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    dm_user1_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_users.id"),
        nullable=True,
    )
    dm_user2_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_users.id"),
        nullable=True,
    )
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("now()"), nullable=False
    )


class Message(Base):
    __tablename__ = "season_messages"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    channel_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_channels.id"),
        nullable=False,
    )
    sender_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_users.id"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    edited_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    attachment_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    attachment_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("now()"), nullable=False
    )


class ReadReceipt(Base):
    __tablename__ = "season_read_receipts"
    __table_args__ = (
        PrimaryKeyConstraint("user_id", "channel_id", name="pk_read_receipt"),
    )

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_users.id"),
        nullable=False,
    )
    channel_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_channels.id"),
        nullable=False,
    )
    last_read_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("now()"), nullable=False
    )
