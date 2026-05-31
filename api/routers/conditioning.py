from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database import get_db
from models.coaching import SCProgram
from schemas.coaching import SCProgramGenerate, SCProgramRead
from services.coaching.sc_engine import generate_sc_program

router = APIRouter(prefix="/api/conditioning", tags=["coaching"])


@router.post("/generate", response_model=SCProgramRead, status_code=201)
async def create_sc_program(body: SCProgramGenerate, db: AsyncSession = Depends(get_db)):
    """Generate an AI S&C program and save it."""
    try:
        generated = await generate_sc_program(
            sport=body.sport,
            age_bracket=body.age_bracket,
            season_phase=body.season_phase,
            weeks=body.weeks,
            days_per_week=body.days_per_week,
            goals=body.goals,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Generation failed: {str(e)}")

    program = SCProgram(
        sport=body.sport,
        age_bracket=body.age_bracket,
        ltad_stage=generated.get("ltad_stage", ""),
        season_phase=body.season_phase,
        weeks=body.weeks,
        days_per_week=body.days_per_week,
        title=generated.get("title", f"{body.sport.title()} {body.age_bracket} — {body.season_phase.replace('_', ' ').title()}"),
        overview=generated.get("overview", ""),
        safety_constraints=generated.get("safety_constraints", []),
        macrocycle=generated.get("weeks", []),
        generation_params=body.model_dump(),
    )
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return program


@router.get("/", response_model=list[SCProgramRead])
async def list_sc_programs(
    sport: str | None = None,
    age_bracket: str | None = None,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    q = select(SCProgram).order_by(desc(SCProgram.created_at)).limit(limit)
    if sport:
        q = q.where(SCProgram.sport == sport)
    if age_bracket:
        q = q.where(SCProgram.age_bracket == age_bracket)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{program_id}", response_model=SCProgramRead)
async def get_sc_program(program_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SCProgram).where(SCProgram.id == program_id))
    program = result.scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=404, detail="S&C program not found")
    return program


@router.delete("/{program_id}", status_code=204)
async def delete_sc_program(program_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SCProgram).where(SCProgram.id == program_id))
    program = result.scalar_one_or_none()
    if not program:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(program)
    await db.commit()
