from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas.rule import QuickRefCard, RuleResolveParams, ActiveRule
from services.rules.resolver import resolve_rules
from services.rules.quick_ref import build_quick_ref

router = APIRouter()


@router.get("/resolve", response_model=list[ActiveRule])
async def get_resolved_rules(
    sport: str = Query(...),
    age_bracket: str = Query(...),
    division_type: str = Query("all"),
    league_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Return the merged active rule set for a given context."""
    return await resolve_rules(db, sport, age_bracket, division_type, league_id)


@router.get("/quick-ref", response_model=QuickRefCard)
async def get_quick_ref(
    sport: str = Query(...),
    age_bracket: str = Query(...),
    division_type: str = Query("recreational"),
    league_id: UUID | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Return the Game-Day Quick Reference card."""
    return await build_quick_ref(db, sport, age_bracket, division_type, league_id)
