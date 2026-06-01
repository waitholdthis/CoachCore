from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.drill import Drill
from schemas.drill import DrillRead, DrillCreate

router = APIRouter(prefix="/api/drills", tags=["drills"])


@router.get("/featured", response_model=list[DrillRead])
async def list_featured_drills(db: AsyncSession = Depends(get_db)):
    """Return drills marked as featured, limit 8."""
    q = select(Drill).where(Drill.is_featured == True).limit(8)  # noqa: E712
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/", response_model=list[DrillRead])
async def list_drills(
    sport: str | None = None,
    difficulty: str | None = None,
    skill_focus: str | None = None,
    age_bracket: str | None = None,
    search: str | None = None,
    featured_only: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List drills with optional filters."""
    q = select(Drill).limit(limit)

    if sport:
        q = q.where(Drill.sport == sport)
    if difficulty:
        q = q.where(Drill.difficulty == difficulty)
    if skill_focus:
        q = q.where(Drill.skill_focus == skill_focus)
    if age_bracket:
        # age_bracket stored as JSONB array — use contains operator
        q = q.where(Drill.age_brackets.contains([age_bracket]))
    if featured_only:
        q = q.where(Drill.is_featured == True)  # noqa: E712
    if search:
        pattern = f"%{search}%"
        q = q.where(
            Drill.title.ilike(pattern) | Drill.description.ilike(pattern)
        )

    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{drill_id}", response_model=DrillRead)
async def get_drill(drill_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve a single drill by ID."""
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    drill = result.scalar_one_or_none()
    if not drill:
        raise HTTPException(status_code=404, detail="Drill not found")
    return drill


@router.post("/", response_model=DrillRead, status_code=201)
async def create_drill(body: DrillCreate, db: AsyncSession = Depends(get_db)):
    """Create a new drill."""
    drill = Drill(**body.model_dump())
    db.add(drill)
    await db.commit()
    await db.refresh(drill)
    return drill


@router.delete("/{drill_id}", status_code=204)
async def delete_drill(drill_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a drill."""
    result = await db.execute(select(Drill).where(Drill.id == drill_id))
    drill = result.scalar_one_or_none()
    if not drill:
        raise HTTPException(status_code=404, detail="Drill not found")
    await db.delete(drill)
    await db.commit()
