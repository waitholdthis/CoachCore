from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.exc import IntegrityError

from database import get_db
from models.resource import SavedItem
from schemas.resource import SavedItemCreate, SavedItemRead

router = APIRouter(prefix="/api/saved", tags=["saved"])


@router.get("/", response_model=list[SavedItemRead])
async def list_saved(item_type: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(SavedItem).order_by(desc(SavedItem.created_at))
    if item_type:
        q = q.where(SavedItem.item_type == item_type)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=SavedItemRead, status_code=201)
async def save_item(body: SavedItemCreate, db: AsyncSession = Depends(get_db)):
    from datetime import datetime
    saved = SavedItem(
        item_type=body.item_type,
        item_id=body.item_id,
        title=body.title,
        notes=body.notes,
        created_at=datetime.utcnow(),
    )
    db.add(saved)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Already saved")
    await db.refresh(saved)
    return saved


@router.delete("/by-item/{item_type}/{item_id}", status_code=204)
async def unsave_by_item(item_type: str, item_id: str, db: AsyncSession = Depends(get_db)):
    """Remove a saved item by its type and original item ID (for bookmark toggle)."""
    result = await db.execute(
        select(SavedItem).where(
            SavedItem.item_type == item_type,
            SavedItem.item_id == item_id,
        )
    )
    saved = result.scalar_one_or_none()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved item not found")
    await db.delete(saved)
    await db.commit()


@router.delete("/{saved_id}", status_code=204)
async def delete_saved(saved_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SavedItem).where(SavedItem.id == saved_id))
    saved = result.scalar_one_or_none()
    if not saved:
        raise HTTPException(status_code=404, detail="Saved item not found")
    await db.delete(saved)
    await db.commit()
