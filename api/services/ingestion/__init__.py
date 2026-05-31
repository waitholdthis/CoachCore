"""
Full document ingestion pipeline: extract → chunk → embed → conflict detect.
"""
from __future__ import annotations
import asyncio
from datetime import datetime
from pathlib import Path
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from models.rule import Rule
from models.upload import RuleUpload
from models.enums import RuleTier, RuleType, IngestionStatus
from services.ingestion.extractor import extract_document
from services.ingestion.chunker import chunk_document, RuleAtom
from services.ingestion.embedder import embed_texts, _rule_to_embed_text
from services.ingestion.conflict_detector import run_conflict_detection


async def ingest_document(
    upload: RuleUpload,
    session: AsyncSession,
    sport: str,
    age_bracket: str,
) -> RuleUpload:
    """Run the full ingestion pipeline for an uploaded document."""
    upload.ingestion_status = IngestionStatus.processing
    upload.processing_started_at = datetime.utcnow()
    session.add(upload)
    await session.commit()

    try:
        # Stage 1: Extract text
        file_path = Path(upload.file_path)
        extraction = extract_document(file_path, upload.mime_type)
        upload.page_count = len(extraction.pages)
        upload.ocr_confidence_avg = extraction.avg_confidence

        # Stage 2: Semantic chunking
        pages_input = [(p.page_number, p.text) for p in extraction.pages if p.text]
        atoms: list[RuleAtom] = await chunk_document(pages_input, sport, age_bracket)

        # Stage 3: Build Rule objects
        local_rules: list[Rule] = []
        ambiguous_count = 0

        for atom in atoms:
            try:
                rule_type = RuleType(atom.rule_type)
            except ValueError:
                rule_type = RuleType.prose

            rule = Rule(
                sport=sport,
                category=atom.category,
                subcategory=atom.subcategory,
                rule_tier=RuleTier.local,
                rule_type=rule_type,
                canonical_text=atom.canonical_text,
                plain_language_text=atom.plain_language_text,
                scope={
                    "age_brackets": atom.age_brackets,
                    "division_types": atom.division_types,
                    "league_levels": ["all"],
                    "temporal_qualifier": atom.temporal_qualifier,
                },
                safety_critical=atom.safety_critical,
                game_day_critical=False,
                numeric_value=atom.numeric_value,
                numeric_unit=atom.numeric_unit,
                normative_certainty=atom.normative_certainty,
                tags=atom.tags,
                league_id=upload.league_id,
                upload_id=upload.id,
                source_page=atom.source_page,
                source_paragraph=atom.source_paragraph,
            )
            session.add(rule)
            local_rules.append(rule)

            if atom.normative_certainty < 0.65:
                ambiguous_count += 1

        await session.commit()

        # Stage 4: Generate embeddings
        embed_texts_list = [_rule_to_embed_text(r) for r in local_rules]
        if embed_texts_list:
            vectors = await embed_texts(embed_texts_list)
            for rule, vector in zip(local_rules, vectors):
                rule.embedding = vector
                session.add(rule)
            await session.commit()

        # Stage 5: Conflict detection
        conflicts = await run_conflict_detection(local_rules, session, upload.league_id)
        safety_flags = sum(1 for c in conflicts if c.safety_critical)

        # Update upload stats
        upload.rules_extracted = len(local_rules)
        upload.conflict_count = len(conflicts)
        upload.safety_flag_count = safety_flags
        upload.ambiguous_rule_count = ambiguous_count
        upload.ingestion_status = IngestionStatus.completed
        upload.processing_completed_at = datetime.utcnow()

    except Exception as exc:
        upload.ingestion_status = IngestionStatus.failed
        upload.error_message = str(exc)
        upload.processing_completed_at = datetime.utcnow()

    session.add(upload)
    await session.commit()
    return upload
