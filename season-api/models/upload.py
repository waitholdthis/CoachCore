from sqlalchemy import String, DateTime, Boolean, Enum, Text, Integer, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from database import Base

UploadTypeEnum = Enum("photo", "video", "document", name="uploadtype")
ModerationStatusEnum = Enum("pending", "approved", "flagged", "removed", name="moderationstatus")


class Upload(Base):
    __tablename__ = "season_uploads"

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
    uploader_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_users.id"),
        nullable=False,
    )
    s3_key: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(UploadTypeEnum, nullable=False)
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    season_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    caption: Mapped[str | None] = mapped_column(Text, nullable=True)
    upload_confirmed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    moderation_status: Mapped[str] = mapped_column(
        ModerationStatusEnum, nullable=False, default="approved"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("now()"), nullable=False
    )


class ContentReport(Base):
    __tablename__ = "season_content_reports"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    reporter_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("season_users.id"),
        nullable=False,
    )
    content_type: Mapped[str] = mapped_column(String(20), nullable=False)
    content_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=text("now()"), nullable=False
    )
