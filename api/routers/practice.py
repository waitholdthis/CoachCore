from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database import get_db
from models.coaching import PracticePlan
from schemas.coaching import PracticePlanGenerate, PracticePlanRead, LTADStageResponse
from services.coaching.session_builder import generate_practice_plan
from services.coaching.ltad import get_ltad_stage, get_sport_specific_constraints

router = APIRouter(prefix="/api/practice", tags=["coaching"])


@router.post("/generate", response_model=PracticePlanRead, status_code=201)
async def create_practice_plan(body: PracticePlanGenerate, db: AsyncSession = Depends(get_db)):
    """Generate an AI practice session plan and save it."""
    try:
        generated = await generate_practice_plan(
            sport=body.sport,
            age_bracket=body.age_bracket,
            focus_area=body.focus_area,
            duration_minutes=body.duration_minutes,
            division_type=body.division_type,
            additional_context=body.additional_context,
            rule_constraints=[],  # TODO: pull from CoachCore rule resolver if league_id provided
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Generation failed: {str(e)}")

    plan = PracticePlan(
        sport=body.sport,
        age_bracket=body.age_bracket,
        division_type=body.division_type,
        league_id=body.league_id,
        title=generated.get("title", f"{body.sport.title()} {body.age_bracket} — {body.focus_area}"),
        overview=generated.get("overview", ""),
        focus_area=body.focus_area,
        duration_minutes=body.duration_minutes,
        phases=generated.get("phases", []),
        equipment_list=generated.get("equipment_list", []),
        safety_notes=generated.get("safety_notes", []),
        coaching_cues=generated.get("coaching_cues", []),
        generation_params=body.model_dump(),
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


@router.get("/", response_model=list[PracticePlanRead])
async def list_practice_plans(
    sport: str | None = None,
    age_bracket: str | None = None,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
):
    q = select(PracticePlan).order_by(desc(PracticePlan.created_at)).limit(limit)
    if sport:
        q = q.where(PracticePlan.sport == sport)
    if age_bracket:
        q = q.where(PracticePlan.age_bracket == age_bracket)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/ltad/{age_bracket}", response_model=LTADStageResponse)
def get_ltad_info(age_bracket: str, sport: str = "soccer"):
    """Returns LTAD stage info and sport-specific constraints for a given age bracket."""
    stage = get_ltad_stage(age_bracket)
    constraints = get_sport_specific_constraints(sport, age_bracket)
    return LTADStageResponse(
        **stage.__dict__,
        sport_constraints=constraints,
    )


@router.get("/{plan_id}", response_model=PracticePlanRead)
async def get_practice_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PracticePlan).where(PracticePlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Practice plan not found")
    return plan


@router.delete("/{plan_id}", status_code=204)
async def delete_practice_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PracticePlan).where(PracticePlan.id == plan_id))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(plan)
    await db.commit()
