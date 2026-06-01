from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc

from database import get_db
from models.roster import PerformanceRecord
from schemas.roster import PerformanceRecordCreate, PerformanceRecordRead

router = APIRouter(prefix="/api/performance", tags=["performance"])


@router.get("/", response_model=list[PerformanceRecordRead])
async def list_records(player_id: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(PerformanceRecord).order_by(desc(PerformanceRecord.recorded_at))
    if player_id:
        q = q.where(PerformanceRecord.player_id == player_id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=PerformanceRecordRead, status_code=201)
async def create_record(body: PerformanceRecordCreate, db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    record = PerformanceRecord(
        player_id=body.player_id,
        sport=body.sport,
        metric_type=body.metric_type,
        value=body.value,
        unit=body.unit,
        context=body.context,
        notes=body.notes,
        recorded_at=body.recorded_at if body.recorded_at is not None else now,
        created_at=now,
    )
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record


@router.get("/player/{player_id}", response_model=list[PerformanceRecordRead])
async def get_player_records(player_id: str, db: AsyncSession = Depends(get_db)):
    """All records for a player ordered by recorded_at asc."""
    q = (
        select(PerformanceRecord)
        .where(PerformanceRecord.player_id == player_id)
        .order_by(asc(PerformanceRecord.recorded_at))
    )
    result = await db.execute(q)
    return result.scalars().all()


@router.delete("/{record_id}", status_code=204)
async def delete_record(record_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PerformanceRecord).where(PerformanceRecord.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    await db.delete(record)
    await db.commit()
