from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
from uuid import UUID

from database import get_db
from models.coaching import GamePlan
from schemas.coaching import GamePlanCreate, GamePlanUpdate, GamePlanRead

router = APIRouter(prefix="/api/gameplan", tags=["coaching"])


async def _fetch_rule_context(
    db: AsyncSession,
    league_id: str,
    sport: str,
    age_bracket: str,
) -> list[dict]:
    """Try to pull relevant rules from the rule resolver. Returns [] on any failure."""
    try:
        from uuid import UUID as _UUID
        from services.rules.resolver import resolve_rules
        active_rules = await resolve_rules(
            session=db,
            sport=sport,
            age_bracket=age_bracket,
            league_id=_UUID(league_id),
        )
        # Return top 5 rules as plain dicts for JSONB storage
        return [r.model_dump(mode="json") for r in active_rules[:5]]
    except Exception:
        return []


@router.post("/", response_model=GamePlanRead, status_code=201)
async def create_game_plan(body: GamePlanCreate, db: AsyncSession = Depends(get_db)):
    """Create a game plan manually (no AI generation)."""
    key_rules_context: list[dict] = []
    if body.league_id:
        key_rules_context = await _fetch_rule_context(db, body.league_id, body.sport, body.age_bracket)

    plan = GamePlan(
        sport=body.sport,
        age_bracket=body.age_bracket,
        league_id=body.league_id,
        title=body.title,
        opponent_name=body.opponent_name,
        formation=body.formation,
        field_positions=body.field_positions,
        tactical_notes=body.tactical_notes,
        set_pieces=body.set_pieces,
        key_rules_context=key_rules_context,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/", response_model=list[GamePlanRead])
async def list_game_plans(
    sport: str | None = None,
    age_bracket: str | None = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    q = select(GamePlan).order_by(desc(GamePlan.created_at)).limit(limit)
    if sport:
        q = q.where(GamePlan.sport == sport)
    if age_bracket:
        q = q.where(GamePlan.age_bracket == age_bracket)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{plan_id}", response_model=GamePlanRead)
async def get_game_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GamePlan).where(GamePlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Game plan not found")
    return plan


@router.patch("/{plan_id}", response_model=GamePlanRead)
async def update_game_plan(plan_id: str, body: GamePlanUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GamePlan).where(GamePlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Game plan not found")

    update_data = body.model_dump(exclude_none=True)
    for field, value in update_data.items():
        setattr(plan, field, value)
    plan.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(plan)
    return plan


@router.delete("/{plan_id}", status_code=204)
async def delete_game_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GamePlan).where(GamePlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(plan)
    await db.commit()
