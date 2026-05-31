from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from database import get_db
from models.league import League
from models.upload import RuleUpload
from models.conflict import ConflictRecord
from schemas.league import LeagueCreate, LeagueRead, LeagueUpdate, UploadRead

router = APIRouter()


@router.post("/", response_model=LeagueRead, status_code=status.HTTP_201_CREATED)
async def create_league(payload: LeagueCreate, db: AsyncSession = Depends(get_db)):
    league = League(**payload.model_dump())
    db.add(league)
    await db.commit()
    await db.refresh(league)
    return await _enrich_league(league, db)


@router.get("/", response_model=list[LeagueRead])
async def list_leagues(sport: str | None = None, db: AsyncSession = Depends(get_db)):
    stmt = select(League)
    if sport:
        stmt = stmt.where(League.sport == sport)
    result = await db.execute(stmt.order_by(League.created_at.desc()))
    leagues = list(result.scalars().all())
    return [await _enrich_league(lg, db) for lg in leagues]


@router.get("/{league_id}", response_model=LeagueRead)
async def get_league(league_id: UUID, db: AsyncSession = Depends(get_db)):
    league = await db.get(League, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    return await _enrich_league(league, db)


@router.patch("/{league_id}", response_model=LeagueRead)
async def update_league(league_id: UUID, payload: LeagueUpdate, db: AsyncSession = Depends(get_db)):
    league = await db.get(League, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    for key, value in payload.model_dump(exclude_none=True).items():
        setattr(league, key, value)
    db.add(league)
    await db.commit()
    await db.refresh(league)
    return await _enrich_league(league, db)


@router.delete("/{league_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_league(league_id: UUID, db: AsyncSession = Depends(get_db)):
    league = await db.get(League, league_id)
    if not league:
        raise HTTPException(status_code=404, detail="League not found")
    await db.delete(league)
    await db.commit()


@router.get("/{league_id}/uploads", response_model=list[UploadRead])
async def list_uploads(league_id: UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RuleUpload)
        .where(RuleUpload.league_id == league_id)
        .order_by(RuleUpload.uploaded_at.desc())
    )
    return list(result.scalars().all())


async def _enrich_league(league: League, db: AsyncSession) -> LeagueRead:
    upload_count = await db.scalar(
        select(func.count()).where(RuleUpload.league_id == league.id)
    ) or 0
    conflict_count = await db.scalar(
        select(func.count()).where(ConflictRecord.league_id == league.id)
    ) or 0
    data = {
        **{c.key: getattr(league, c.key) for c in league.__table__.columns},
        "upload_count": upload_count,
        "conflict_count": conflict_count,
    }
    return LeagueRead(**data)
