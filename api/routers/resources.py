from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database import get_db
from models.resource import Resource
from schemas.resource import ResourceCreate, ResourceRead
from services.seed_resources import seed_resources

router = APIRouter(prefix="/api/resources", tags=["resources"])


@router.get("/featured", response_model=list[ResourceRead])
async def get_featured_resources(db: AsyncSession = Depends(get_db)):
    """Return all featured resources."""
    result = await db.execute(
        select(Resource)
        .where(Resource.is_featured == True)  # noqa: E712
        .order_by(desc(Resource.created_at))
    )
    return result.scalars().all()


@router.get("/", response_model=list[ResourceRead])
async def list_resources(
    resource_type: str | None = None,
    sport: str | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(Resource).order_by(desc(Resource.created_at))
    if resource_type:
        q = q.where(Resource.resource_type == resource_type)
    if sport:
        q = q.where(Resource.sport == sport)
    if search:
        q = q.where(Resource.title.ilike(f"%{search}%"))
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/{resource_id}", response_model=ResourceRead)
async def get_resource(resource_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Resource).where(Resource.id == resource_id))
    resource = result.scalar_one_or_none()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource


@router.post("/", response_model=ResourceRead, status_code=201)
async def create_resource(body: ResourceCreate, db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    resource = Resource(
        title=body.title,
        body=body.body,
        resource_type=body.resource_type,
        sport=body.sport,
        tags=body.tags,
        is_featured=body.is_featured,
        read_time_minutes=body.read_time_minutes,
        created_at=datetime.utcnow(),
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


@router.post("/seed")
async def seed(db: AsyncSession = Depends(get_db)):
    """Seed the resources table with default content if empty."""
    inserted = await seed_resources(db)
    return {"inserted": inserted}
