"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-05-31
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    # Enums
    sport_enum = postgresql.ENUM(
        "soccer", "baseball", "basketball", "football",
        name="sport", create_type=True
    )
    rule_tier_enum = postgresql.ENUM(
        "baseline", "governing_body", "local", "tournament",
        name="ruletier", create_type=True
    )
    rule_type_enum = postgresql.ENUM(
        "boolean", "numeric", "enumerated", "prose",
        name="ruletype", create_type=True
    )
    conflict_type_enum = postgresql.ENUM(
        "OVERRIDE", "RESTRICT", "EXPAND", "SUPPLEMENT", "CONFLICT",
        name="conflicttype", create_type=True
    )
    conflict_resolution_enum = postgresql.ENUM(
        "LOCAL_OVERRIDES", "BASELINE_APPLIES", "PENDING_REVIEW",
        name="conflictresolution", create_type=True
    )
    ingestion_status_enum = postgresql.ENUM(
        "pending", "processing", "completed", "failed", "partial",
        name="ingestionstatus", create_type=True
    )
    for e in [sport_enum, rule_tier_enum, rule_type_enum, conflict_type_enum,
              conflict_resolution_enum, ingestion_status_enum]:
        e.create(op.get_bind(), checkfirst=True)

    # leagues
    op.create_table(
        "leagues",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("sport", sport_enum, nullable=False),
        sa.Column("season", sa.String(50), nullable=True),
        sa.Column("governing_body", sa.String(200), nullable=True),
        sa.Column("age_brackets_served", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("division_types_served", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("contact_admin", sa.String(200), nullable=True),
        sa.Column("created_by", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_leagues_sport", "leagues", ["sport"])

    # rule_uploads
    op.create_table(
        "rule_uploads",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("league_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("leagues.id"), nullable=False),
        sa.Column("filename", sa.String(500), nullable=False),
        sa.Column("original_filename", sa.String(500), nullable=False),
        sa.Column("file_path", sa.String(1000), nullable=False),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("ingestion_status", ingestion_status_enum, nullable=False, server_default="pending"),
        sa.Column("page_count", sa.Integer(), nullable=True),
        sa.Column("rules_extracted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("conflict_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("safety_flag_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ambiguous_rule_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ocr_confidence_avg", sa.Float(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("uploaded_by", sa.String(200), nullable=True),
        sa.Column("processing_started_at", sa.DateTime(), nullable=True),
        sa.Column("processing_completed_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_rule_uploads_league_id", "rule_uploads", ["league_id"])
    op.create_index("ix_rule_uploads_ingestion_status", "rule_uploads", ["ingestion_status"])

    # rules
    op.create_table(
        "rules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("sport", sport_enum, nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("subcategory", sa.String(100), nullable=True),
        sa.Column("rule_tier", rule_tier_enum, nullable=False, server_default="baseline"),
        sa.Column("rule_type", rule_type_enum, nullable=False, server_default="prose"),
        sa.Column("canonical_text", sa.Text(), nullable=False),
        sa.Column("plain_language_text", sa.Text(), nullable=True),
        sa.Column("scope", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("safety_critical", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("game_day_critical", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("display_priority", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("numeric_value", sa.Float(), nullable=True),
        sa.Column("numeric_unit", sa.String(50), nullable=True),
        sa.Column("governing_body_source", sa.String(200), nullable=True),
        sa.Column("effective_date", sa.DateTime(), nullable=True),
        sa.Column("review_date", sa.DateTime(), nullable=True),
        sa.Column("superseded_by_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rules.id"), nullable=True),
        sa.Column("league_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("leagues.id"), nullable=True),
        sa.Column("upload_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rule_uploads.id"), nullable=True),
        sa.Column("source_page", sa.Integer(), nullable=True),
        sa.Column("source_paragraph", sa.String(50), nullable=True),
        sa.Column("embedding", sa.Column("embedding", sa.Text())),  # placeholder; vector type added below
        sa.Column("tags", postgresql.ARRAY(sa.String()), nullable=False, server_default="{}"),
        sa.Column("related_rule_ids", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False, server_default="{}"),
        sa.Column("normative_certainty", sa.Float(), nullable=True),
        sa.Column("human_resolved", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("human_resolution_choice", sa.String(50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
    )

    # Replace placeholder with real vector column
    op.execute("ALTER TABLE rules DROP COLUMN IF EXISTS embedding")
    op.execute("ALTER TABLE rules ADD COLUMN embedding vector(1536)")

    op.create_index("ix_rules_sport", "rules", ["sport"])
    op.create_index("ix_rules_category", "rules", ["category"])
    op.create_index("ix_rules_rule_tier", "rules", ["rule_tier"])
    op.create_index("ix_rules_league_id", "rules", ["league_id"])
    op.create_index("ix_rules_safety_critical", "rules", ["safety_critical"])
    op.create_index("ix_rules_game_day_critical", "rules", ["game_day_critical"])

    # IVFFlat approximate nearest-neighbor index (requires data to be present first; created post-seed)
    # op.execute("CREATE INDEX rules_embedding_idx ON rules USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)")

    # conflict_records
    op.create_table(
        "conflict_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("league_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("leagues.id"), nullable=False),
        sa.Column("sport", sport_enum, nullable=False),
        sa.Column("conflict_type", conflict_type_enum, nullable=False),
        sa.Column("effective_scope", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("baseline_rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rules.id"), nullable=False),
        sa.Column("local_rule_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rules.id"), nullable=False),
        sa.Column("similarity_score", sa.Float(), nullable=True),
        sa.Column("classification_confidence", sa.Float(), nullable=True),
        sa.Column("resolution", conflict_resolution_enum, nullable=False, server_default="PENDING_REVIEW"),
        sa.Column("coach_flag", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("flag_message", sa.Text(), nullable=True),
        sa.Column("safety_critical", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("verified_by_admin", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("resolved_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_conflict_records_league_id", "conflict_records", ["league_id"])
    op.create_index("ix_conflict_records_sport", "conflict_records", ["sport"])
    op.create_index("ix_conflict_records_resolution", "conflict_records", ["resolution"])
    op.create_index("ix_conflict_records_safety_critical", "conflict_records", ["safety_critical"])


def downgrade() -> None:
    op.drop_table("conflict_records")
    op.drop_table("rules")
    op.drop_table("rule_uploads")
    op.drop_table("leagues")
    for enum_name in ["sport", "ruletier", "ruletype", "conflicttype", "conflictresolution", "ingestionstatus"]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
