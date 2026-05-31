from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from schemas.diff import DiffRequest, RuleDiff
from services.diff.comparator import generate_diff

router = APIRouter()


@router.post("/", response_model=RuleDiff)
async def rule_diff(payload: DiffRequest, db: AsyncSession = Depends(get_db)):
    """Generate a Rule Diff between two rule contexts (e.g. home league vs. away tournament)."""
    return await generate_diff(db, payload.home, payload.away)
