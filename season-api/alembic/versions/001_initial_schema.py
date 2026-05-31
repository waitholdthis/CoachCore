"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-31 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # uuid-ossp is created by superuser before running this migration
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Create enum types safely
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE memberrole AS ENUM ('parent', 'coach', 'admin');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE channeltype AS ENUM ('team_chat', 'announcements', 'direct');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE eventtype AS ENUM ('practice', 'game', 'other');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE rsvpstatus AS ENUM ('yes', 'no', 'maybe');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE uploadtype AS ENUM ('photo', 'video', 'document');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE moderationstatus AS ENUM ('pending', 'approved', 'flagged', 'removed');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
    """)

    # season_users
    op.create_table(
        "season_users",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("avatar_key", sa.String(500), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("email", name="uq_season_users_email"),
    )

    # season_teams
    op.create_table(
        "season_teams",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("sport", sa.String(100), nullable=True),
        sa.Column("season_name", sa.String(100), nullable=True),
        sa.Column("season_start", sa.Date(), nullable=True),
        sa.Column("season_end", sa.Date(), nullable=True),
        sa.Column("invite_code", sa.String(10), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("invite_code", name="uq_season_teams_invite_code"),
    )

    # season_team_members
    op.create_table(
        "season_team_members",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("team_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_teams.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=False),
        sa.Column(
            "role",
            postgresql.ENUM("parent", "coach", "admin", name="memberrole", create_type=False),
            nullable=False,
            server_default="parent",
        ),
        sa.Column("child_names", postgresql.ARRAY(sa.String()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("is_approved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("joined_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("approved_by", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=True),
        sa.UniqueConstraint("team_id", "user_id", name="uq_team_member"),
    )

    # season_channels
    op.create_table(
        "season_channels",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("team_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_teams.id"), nullable=False),
        sa.Column(
            "channel_type",
            postgresql.ENUM("team_chat", "announcements", "direct", name="channeltype", create_type=False),
            nullable=False,
        ),
        sa.Column("name", sa.String(100), nullable=True),
        sa.Column("dm_user1_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=True),
        sa.Column("dm_user2_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=True),
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # season_messages
    op.create_table(
        "season_messages",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("channel_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_channels.id"), nullable=False),
        sa.Column("sender_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("edited_at", sa.DateTime(), nullable=True),
        sa.Column("attachment_key", sa.String(500), nullable=True),
        sa.Column("attachment_type", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # season_read_receipts
    op.create_table(
        "season_read_receipts",
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=False),
        sa.Column("channel_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_channels.id"), nullable=False),
        sa.Column("last_read_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("user_id", "channel_id", name="pk_read_receipt"),
    )

    # season_events
    op.create_table(
        "season_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("team_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_teams.id"), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column(
            "event_type",
            postgresql.ENUM("practice", "game", "other", name="eventtype", create_type=False),
            nullable=False,
            server_default="practice",
        ),
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=True),
        sa.Column("location", sa.String(300), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("is_cancelled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_by", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # season_rsvps
    op.create_table(
        "season_rsvps",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("event_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_events.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("yes", "no", "maybe", name="rsvpstatus", create_type=False),
            nullable=False,
        ),
        sa.Column("note", sa.String(300), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("event_id", "user_id", name="uq_rsvp"),
    )

    # season_uploads
    op.create_table(
        "season_uploads",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("team_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_teams.id"), nullable=False),
        sa.Column("uploader_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=False),
        sa.Column("s3_key", sa.String(500), nullable=False),
        sa.Column("thumbnail_key", sa.String(500), nullable=True),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column(
            "file_type",
            postgresql.ENUM("photo", "video", "document", name="uploadtype", create_type=False),
            nullable=False,
        ),
        sa.Column("content_type", sa.String(100), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("season_label", sa.String(100), nullable=True),
        sa.Column("caption", sa.Text(), nullable=True),
        sa.Column("upload_confirmed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column(
            "moderation_status",
            postgresql.ENUM("pending", "approved", "flagged", "removed", name="moderationstatus", create_type=False),
            nullable=False,
            server_default="approved",
        ),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # season_content_reports
    op.create_table(
        "season_content_reports",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("reporter_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("season_users.id"), nullable=False),
        sa.Column("content_type", sa.String(20), nullable=False),
        sa.Column("content_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="open"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # Indexes
    op.create_index("ix_season_users_email", "season_users", ["email"])
    op.create_index("ix_season_team_members_team_id", "season_team_members", ["team_id"])
    op.create_index("ix_season_team_members_user_id", "season_team_members", ["user_id"])
    op.create_index("ix_season_channels_team_id", "season_channels", ["team_id"])
    op.create_index("ix_season_messages_channel_id", "season_messages", ["channel_id"])
    op.create_index("ix_season_messages_created_at", "season_messages", ["created_at"])
    op.create_index("ix_season_events_team_id", "season_events", ["team_id"])
    op.create_index("ix_season_events_start_time", "season_events", ["start_time"])
    op.create_index("ix_season_uploads_team_id", "season_uploads", ["team_id"])


def downgrade() -> None:
    # Drop indexes
    op.drop_index("ix_season_uploads_team_id", table_name="season_uploads")
    op.drop_index("ix_season_events_start_time", table_name="season_events")
    op.drop_index("ix_season_events_team_id", table_name="season_events")
    op.drop_index("ix_season_messages_created_at", table_name="season_messages")
    op.drop_index("ix_season_messages_channel_id", table_name="season_messages")
    op.drop_index("ix_season_channels_team_id", table_name="season_channels")
    op.drop_index("ix_season_team_members_user_id", table_name="season_team_members")
    op.drop_index("ix_season_team_members_team_id", table_name="season_team_members")
    op.drop_index("ix_season_users_email", table_name="season_users")

    # Drop tables in reverse dependency order
    op.drop_table("season_content_reports")
    op.drop_table("season_uploads")
    op.drop_table("season_rsvps")
    op.drop_table("season_events")
    op.drop_table("season_read_receipts")
    op.drop_table("season_messages")
    op.drop_table("season_channels")
    op.drop_table("season_team_members")
    op.drop_table("season_teams")
    op.drop_table("season_users")

    # Drop enum types
    op.execute("DROP TYPE IF EXISTS moderationstatus")
    op.execute("DROP TYPE IF EXISTS uploadtype")
    op.execute("DROP TYPE IF EXISTS rsvpstatus")
    op.execute("DROP TYPE IF EXISTS eventtype")
    op.execute("DROP TYPE IF EXISTS channeltype")
    op.execute("DROP TYPE IF EXISTS memberrole")
