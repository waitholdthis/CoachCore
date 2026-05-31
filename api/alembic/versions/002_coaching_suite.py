"""coaching suite: practice plans, s&c programs, game plans

Revision ID: 002
Revises: 001
Create Date: 2026-05-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "practice_plans",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("sport", sa.String(50), nullable=False),
        sa.Column("age_bracket", sa.String(20), nullable=False),
        sa.Column("division_type", sa.String(50), nullable=True),
        sa.Column("league_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("overview", sa.Text(), nullable=False),
        sa.Column("focus_area", sa.String(200), nullable=False),
        sa.Column("duration_minutes", sa.Integer(), nullable=False),
        sa.Column("phases", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("equipment_list", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("safety_notes", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("coaching_cues", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("generation_params", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_practice_plans_sport_age", "practice_plans", ["sport", "age_bracket"])

    op.create_table(
        "sc_programs",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("sport", sa.String(50), nullable=False),
        sa.Column("age_bracket", sa.String(20), nullable=False),
        sa.Column("ltad_stage", sa.String(100), nullable=False),
        sa.Column("season_phase", sa.String(50), nullable=False),
        sa.Column("weeks", sa.Integer(), nullable=False),
        sa.Column("days_per_week", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("overview", sa.Text(), nullable=False),
        sa.Column("safety_constraints", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("macrocycle", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("generation_params", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_sc_programs_sport_age", "sc_programs", ["sport", "age_bracket"])

    op.create_table(
        "game_plans",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("sport", sa.String(50), nullable=False),
        sa.Column("age_bracket", sa.String(20), nullable=False),
        sa.Column("league_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("opponent_name", sa.String(200), nullable=True),
        sa.Column("formation", sa.String(50), nullable=True),
        sa.Column("field_positions", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("tactical_notes", sa.Text(), nullable=True),
        sa.Column("set_pieces", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("key_rules_context", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'")),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_game_plans_sport_age", "game_plans", ["sport", "age_bracket"])


def downgrade() -> None:
    op.drop_index("ix_game_plans_sport_age", table_name="game_plans")
    op.drop_table("game_plans")
    op.drop_index("ix_sc_programs_sport_age", table_name="sc_programs")
    op.drop_table("sc_programs")
    op.drop_index("ix_practice_plans_sport_age", table_name="practice_plans")
    op.drop_table("practice_plans")
