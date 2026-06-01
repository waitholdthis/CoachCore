from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database import get_db
from models.calendar import Season, SeasonWeek
from schemas.calendar import (
    SeasonCreate,
    SeasonRead,
    SeasonWeekRead,
    SeasonWeekUpdate,
)


class SeasonUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    goals: list[str] | None = None

router = APIRouter(prefix="/api/seasons", tags=["seasons"])


@router.get("/", response_model=list[SeasonRead])
async def list_seasons(db: AsyncSession = Depends(get_db)):
    """List all seasons ordered by start_date descending."""
    result = await db.execute(select(Season).order_by(desc(Season.start_date)))
    return result.scalars().all()


@router.post("/", response_model=SeasonRead, status_code=201)
async def create_season(body: SeasonCreate, db: AsyncSession = Depends(get_db)):
    """Create a season and auto-generate SeasonWeek rows."""
    total_weeks = max(1, (body.end_date - body.start_date).days // 7)

    season = Season(
        title=body.title,
        sport=body.sport,
        age_bracket=body.age_bracket,
        start_date=body.start_date,
        end_date=body.end_date,
        total_weeks=total_weeks,
        description=body.description,
        goals=body.goals,
    )
    db.add(season)
    await db.flush()  # populate season.id before creating week rows

    for week_num in range(1, total_weeks + 1):
        week = SeasonWeek(
            season_id=season.id,
            week_number=week_num,
        )
        db.add(week)

    await db.commit()
    await db.refresh(season)
    return season


@router.get("/{season_id}", response_model=SeasonRead)
async def get_season(season_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve a single season by ID."""
    result = await db.execute(select(Season).where(Season.id == season_id))
    season = result.scalar_one_or_none()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    return season


@router.patch("/{season_id}", response_model=SeasonRead)
async def update_season(season_id: str, body: SeasonUpdate, db: AsyncSession = Depends(get_db)):
    """Update title, description, or goals on an existing season."""
    result = await db.execute(select(Season).where(Season.id == season_id))
    season = result.scalar_one_or_none()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")

    patch = body.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(season, field, value)

    season.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(season)
    return season


@router.delete("/{season_id}", status_code=204)
async def delete_season(season_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a season (cascade deletes its season_weeks)."""
    result = await db.execute(select(Season).where(Season.id == season_id))
    season = result.scalar_one_or_none()
    if not season:
        raise HTTPException(status_code=404, detail="Season not found")
    await db.delete(season)
    await db.commit()


@router.get("/{season_id}/weeks", response_model=list[SeasonWeekRead])
async def list_season_weeks(season_id: str, db: AsyncSession = Depends(get_db)):
    """List all weeks for a season ordered by week_number."""
    # Verify season exists
    season_result = await db.execute(select(Season).where(Season.id == season_id))
    if not season_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Season not found")

    result = await db.execute(
        select(SeasonWeek)
        .where(SeasonWeek.season_id == season_id)
        .order_by(SeasonWeek.week_number.asc())
    )
    return result.scalars().all()


@router.patch("/{season_id}/weeks/{week_number}", response_model=SeasonWeekRead)
async def update_season_week(
    season_id: str,
    week_number: int,
    body: SeasonWeekUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a specific week's theme, focus_skills, linked_plan_id, or notes."""
    # Verify season exists
    season_result = await db.execute(select(Season).where(Season.id == season_id))
    if not season_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Season not found")

    result = await db.execute(
        select(SeasonWeek)
        .where(SeasonWeek.season_id == season_id)
        .where(SeasonWeek.week_number == week_number)
    )
    week = result.scalar_one_or_none()
    if not week:
        raise HTTPException(status_code=404, detail=f"Week {week_number} not found for this season")

    patch = body.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(week, field, value)

    week.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(week)
    return week
