import asyncio
import uuid
from pathlib import Path
from uuid import UUID
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.league import League
from models.upload import RuleUpload
from models.enums import IngestionStatus
from schemas.league import UploadRead
from schemas.conflict import ConflictRecordRead, ConflictSummary, ConflictResolve
from models.conflict import ConflictRecord
from services.ingestion import ingest_document
from config import get_settings

settings = get_settings()
router = APIRouter()

ALLOWED_MIME_TYPES = {
    "application/pdf", "image/png", "image/jpeg", "image/jpg",
    "image/tiff", "image/bmp", "image/webp",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


@router.post("/upload/{league_id}", response_model=UploadRead, status_code=status.HTTP_202_ACCEPTED)
async def upload_rulebook(
    league_id: UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    sport: str = Form(...),
    age_bracket: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Upload and asynchronously process a league rulebook document."""
    league = await db.get(League, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")

    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: PDF, PNG, JPEG, TIFF, DOCX."
        )

    # Save file to disk
    file_id = uuid.uuid4()
    safe_name = f"{file_id}_{file.filename.replace(' ', '_')}"
    dest_path = settings.upload_path / safe_name
    content = await file.read()

    if len(content) > settings.max_upload_size_mb * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File too large. Max {settings.max_upload_size_mb}MB.")

    dest_path.write_bytes(content)

    upload = RuleUpload(
        id=file_id,
        league_id=league_id,
        filename=safe_name,
        original_filename=file.filename,
        file_path=str(dest_path),
        file_size_bytes=len(content),
        mime_type=file.content_type,
        ingestion_status=IngestionStatus.pending,
    )
    db.add(upload)
    await db.commit()
    await db.refresh(upload)

    # Run ingestion in background
    background_tasks.add_task(
        _run_ingestion_background,
        upload_id=upload.id,
        sport=sport,
        age_bracket=age_bracket,
    )

    return upload


async def _run_ingestion_background(upload_id: UUID, sport: str, age_bracket: str) -> None:
    """Background task wrapper for ingestion pipeline."""
    from database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        upload = await session.get(RuleUpload, upload_id)
        if upload:
            await ingest_document(upload, session, sport, age_bracket)


@router.get("/status/{upload_id}", response_model=UploadRead)
async def get_upload_status(upload_id: UUID, db: AsyncSession = Depends(get_db)):
    upload = await db.get(RuleUpload, upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")
    return upload


@router.get("/conflicts/{league_id}", response_model=list[ConflictRecordRead])
async def list_conflicts(
    league_id: UUID,
    unresolved_only: bool = False,
    safety_only: bool = False,
    db: AsyncSession = Depends(get_db),
):
    from sqlalchemy import and_
    from models.enums import ConflictResolution
    from sqlalchemy.orm import selectinload

    stmt = (
        select(ConflictRecord)
        .options(
            selectinload(ConflictRecord.baseline_rule),
            selectinload(ConflictRecord.local_rule),
        )
        .where(ConflictRecord.league_id == league_id)
    )
    if unresolved_only:
        stmt = stmt.where(ConflictRecord.resolution == ConflictResolution.pending_review)
    if safety_only:
        stmt = stmt.where(ConflictRecord.safety_critical == True)

    result = await db.execute(stmt.order_by(ConflictRecord.safety_critical.desc(), ConflictRecord.created_at.desc()))
    return list(result.scalars().all())


@router.patch("/conflicts/{conflict_id}/resolve", response_model=ConflictRecordRead)
async def resolve_conflict(
    conflict_id: UUID,
    payload: ConflictResolve,
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(ConflictRecord)
        .options(
            selectinload(ConflictRecord.baseline_rule),
            selectinload(ConflictRecord.local_rule),
        )
        .where(ConflictRecord.id == conflict_id)
    )
    conflict = result.scalar_one_or_none()
    if not conflict:
        raise HTTPException(status_code=404, detail="Conflict not found")

    conflict.resolution = payload.resolution
    conflict.admin_notes = payload.admin_notes
    conflict.verified_by_admin = True
    conflict.resolved_at = datetime.utcnow()
    db.add(conflict)
    await db.commit()
    await db.refresh(conflict)
    return conflict


@router.get("/conflicts/{league_id}/summary", response_model=ConflictSummary)
async def conflict_summary(league_id: UUID, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func
    from models.enums import ConflictResolution

    total = await db.scalar(select(func.count()).where(ConflictRecord.league_id == league_id)) or 0
    pending = await db.scalar(
        select(func.count()).where(
            ConflictRecord.league_id == league_id,
            ConflictRecord.resolution == ConflictResolution.pending_review,
        )
    ) or 0
    safety = await db.scalar(
        select(func.count()).where(
            ConflictRecord.league_id == league_id,
            ConflictRecord.safety_critical == True,
        )
    ) or 0
    local = await db.scalar(
        select(func.count()).where(
            ConflictRecord.league_id == league_id,
            ConflictRecord.resolution == ConflictResolution.local_overrides,
        )
    ) or 0

    return ConflictSummary(
        league_id=league_id,
        total=total,
        pending_review=pending,
        safety_critical=safety,
        local_overrides=local,
    )
