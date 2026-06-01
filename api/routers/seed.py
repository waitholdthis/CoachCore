from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from services.seed_drills import seed_drills, seed_templates

router = APIRouter(prefix="/api/seed", tags=["seed"])


@router.post("/drills")
async def run_seed_drills(db: AsyncSession = Depends(get_db)):
    """Seed the drills library. Idempotent — skips if drills already exist."""
    inserted = await seed_drills(db)
    return {"inserted": inserted}


@router.post("/templates")
async def run_seed_templates(db: AsyncSession = Depends(get_db)):
    """Seed the practice templates library. Idempotent — skips if templates already exist."""
    inserted = await seed_templates(db)
    return {"inserted": inserted}
