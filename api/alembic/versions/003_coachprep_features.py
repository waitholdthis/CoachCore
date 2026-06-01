"""coachprep features: drills, templates, calendar, seasons, roster, performance, resources, saved

Revision ID: 003
Revises: 002
Create Date: 2026-05-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── drills ────────────────────────────────────────────────────────────────
    op.create_table(
        "drills",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("sport", sa.String(50), nullable=False),
        sa.Column("skill_focus", sa.String(100), nullable=False),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="beginner"),  # beginner|intermediate|advanced
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default=sa.text("15")),
        sa.Column("player_count_min", sa.Integer(), nullable=True),
        sa.Column("player_count_max", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("setup", sa.Text(), nullable=True),
        sa.Column("instructions", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("coaching_points", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("progressions", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("equipment", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("tags", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("age_brackets", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_drills_sport", "drills", ["sport"])
    op.create_index("ix_drills_difficulty", "drills", ["difficulty"])
    op.create_index("ix_drills_sport_difficulty", "drills", ["sport", "difficulty"])

    # ── practice_templates ────────────────────────────────────────────────────
    op.create_table(
        "practice_templates",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("sport", sa.String(50), nullable=False),
        sa.Column("age_bracket", sa.String(20), nullable=False),
        sa.Column("difficulty", sa.String(20), nullable=False, server_default="beginner"),
        sa.Column("duration_minutes", sa.Integer(), nullable=False, server_default=sa.text("90")),
        sa.Column("player_count_min", sa.Integer(), nullable=True),
        sa.Column("player_count_max", sa.Integer(), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("overview", sa.Text(), nullable=True),
        sa.Column("phases", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("equipment_list", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("tags", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_practice_templates_sport", "practice_templates", ["sport"])
    op.create_index("ix_practice_templates_sport_age", "practice_templates", ["sport", "age_bracket"])

    # ── calendar_events ───────────────────────────────────────────────────────
    op.create_table(
        "calendar_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("event_type", sa.String(20), nullable=False, server_default="practice"),  # practice|game|training|other
        sa.Column("start_time", sa.DateTime(), nullable=False),
        sa.Column("end_time", sa.DateTime(), nullable=True),
        sa.Column("location", sa.String(300), nullable=True),
        sa.Column("sport", sa.String(50), nullable=True),
        sa.Column("age_bracket", sa.String(20), nullable=True),
        sa.Column("team_name", sa.String(200), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("linked_plan_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("practice_plans.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_completed", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_calendar_events_start_time", "calendar_events", ["start_time"])
    op.create_index("ix_calendar_events_sport", "calendar_events", ["sport"])

    # ── seasons ───────────────────────────────────────────────────────────────
    op.create_table(
        "seasons",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("sport", sa.String(50), nullable=False),
        sa.Column("age_bracket", sa.String(20), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("total_weeks", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("goals", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_seasons_sport", "seasons", ["sport"])

    # ── season_weeks ──────────────────────────────────────────────────────────
    op.create_table(
        "season_weeks",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("season_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_number", sa.Integer(), nullable=False),
        sa.Column("theme", sa.String(200), nullable=True),
        sa.Column("focus_skills", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("linked_plan_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("practice_plans.id", ondelete="SET NULL"), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("season_id", "week_number", name="uq_season_week"),
    )
    op.create_index("ix_season_weeks_season_id", "season_weeks", ["season_id"])

    # ── players ───────────────────────────────────────────────────────────────
    op.create_table(
        "players",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("number", sa.Integer(), nullable=True),
        sa.Column("position", sa.String(100), nullable=True),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("sport", sa.String(50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("emergency_contact", sa.String(200), nullable=True),
        sa.Column("medical_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # ── roster_teams ──────────────────────────────────────────────────────────
    op.create_table(
        "roster_teams",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("sport", sa.String(50), nullable=False),
        sa.Column("age_bracket", sa.String(20), nullable=False),
        sa.Column("season_label", sa.String(100), nullable=True),
        sa.Column("head_coach", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_roster_teams_sport", "roster_teams", ["sport"])

    # ── roster_team_players ───────────────────────────────────────────────────
    op.create_table(
        "roster_team_players",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("team_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("roster_teams.id", ondelete="CASCADE"), nullable=False),
        sa.Column("player_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("joined_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("team_id", "player_id", name="uq_roster_team_player"),
    )
    op.create_index("ix_roster_team_players_team_id", "roster_team_players", ["team_id"])

    # ── performance_records ───────────────────────────────────────────────────
    op.create_table(
        "performance_records",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("player_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("players.id", ondelete="CASCADE"), nullable=False),
        sa.Column("recorded_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("sport", sa.String(50), nullable=True),
        sa.Column("metric_type", sa.String(100), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(50), nullable=True),
        sa.Column("context", sa.String(200), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_performance_records_player_id", "performance_records", ["player_id"])
    op.create_index("ix_performance_records_recorded_at", "performance_records", ["recorded_at"])

    # ── resources ─────────────────────────────────────────────────────────────
    op.create_table(
        "resources",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("resource_type", sa.String(30), nullable=False, server_default="tip"),  # tip|article|motivation|best_practice
        sa.Column("sport", sa.String(50), nullable=True),
        sa.Column("tags", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("read_time_minutes", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_resources_type", "resources", ["resource_type"])
    op.create_index("ix_resources_sport", "resources", ["sport"])

    # ── saved_items ───────────────────────────────────────────────────────────
    op.create_table(
        "saved_items",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("item_type", sa.String(30), nullable=False),  # drill|template|resource|practice_plan|sc_program
        sa.Column("item_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.UniqueConstraint("item_type", "item_id", name="uq_saved_item"),
    )
    op.create_index("ix_saved_items_type", "saved_items", ["item_type"])


def downgrade() -> None:
    op.drop_index("ix_saved_items_type", table_name="saved_items")
    op.drop_table("saved_items")
    op.drop_index("ix_resources_sport", table_name="resources")
    op.drop_index("ix_resources_type", table_name="resources")
    op.drop_table("resources")
    op.drop_index("ix_performance_records_recorded_at", table_name="performance_records")
    op.drop_index("ix_performance_records_player_id", table_name="performance_records")
    op.drop_table("performance_records")
    op.drop_index("ix_roster_team_players_team_id", table_name="roster_team_players")
    op.drop_table("roster_team_players")
    op.drop_index("ix_roster_teams_sport", table_name="roster_teams")
    op.drop_table("roster_teams")
    op.drop_table("players")
    op.drop_index("ix_season_weeks_season_id", table_name="season_weeks")
    op.drop_table("season_weeks")
    op.drop_index("ix_seasons_sport", table_name="seasons")
    op.drop_table("seasons")
    op.drop_index("ix_calendar_events_sport", table_name="calendar_events")
    op.drop_index("ix_calendar_events_start_time", table_name="calendar_events")
    op.drop_table("calendar_events")
    op.drop_index("ix_practice_templates_sport_age", table_name="practice_templates")
    op.drop_index("ix_practice_templates_sport", table_name="practice_templates")
    op.drop_table("practice_templates")
    op.drop_index("ix_drills_sport_difficulty", table_name="drills")
    op.drop_index("ix_drills_difficulty", table_name="drills")
    op.drop_index("ix_drills_sport", table_name="drills")
    op.drop_table("drills")
