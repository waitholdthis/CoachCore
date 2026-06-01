from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.drill import PracticeTemplate
from schemas.drill import PracticeTemplateRead, PracticeTemplateCreate

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("/featured", response_model=list[PracticeTemplateRead])
async def list_featured_templates(db: AsyncSession = Depends(get_db)):
    """Return practice templates marked as featured, limit 6."""
    q = select(PracticeTemplate).where(PracticeTemplate.is_featured == True).limit(6)  # noqa: E712
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/", response_model=list[PracticeTemplateRead])
async def list_templates(
    sport: str | None = None,
    age_bracket: str | None = None,
    difficulty: str | None = None,
    search: str | None = None,
    featured_only: bool = False,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """List practice templates with optional filters."""
    q = select(PracticeTemplate).limit(limit)

    if sport:
        q = q.where(PracticeTemplate.sport == sport)
    if age_bracket:
        q = q.where(PracticeTemplate.age_bracket == age_bracket)
    if difficulty:
        q = q.where(PracticeTemplate.difficulty == difficulty)
    if featured_only:
        q = q.where(PracticeTemplate.is_featured == True)  # noqa: E712
    if search:
        pattern = f"%{search}%"
        q = q.where(
            PracticeTemplate.title.ilike(pattern)
            | PracticeTemplate.description.ilike(pattern)
        )

    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{template_id}", response_model=PracticeTemplateRead)
async def get_template(template_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve a single practice template by ID."""
    result = await db.execute(
        select(PracticeTemplate).where(PracticeTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Practice template not found")
    return template


@router.post("/", response_model=PracticeTemplateRead, status_code=201)
async def create_template(
    body: PracticeTemplateCreate, db: AsyncSession = Depends(get_db)
):
    """Create a new practice template."""
    template = PracticeTemplate(**body.model_dump())
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=204)
async def delete_template(template_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a practice template."""
    result = await db.execute(
        select(PracticeTemplate).where(PracticeTemplate.id == template_id)
    )
    template = result.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Practice template not found")
    await db.delete(template)
    await db.commit()
