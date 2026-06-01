from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.calendar import CalendarEvent
from schemas.calendar import CalendarEventCreate, CalendarEventUpdate, CalendarEventRead

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/", response_model=list[CalendarEventRead])
async def list_events(
    start: str | None = None,
    end: str | None = None,
    sport: str | None = None,
    event_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List calendar events with optional filters."""
    q = select(CalendarEvent).order_by(CalendarEvent.start_time.asc())

    if start:
        try:
            start_dt = datetime.fromisoformat(start)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid 'start' datetime format")
        q = q.where(CalendarEvent.start_time >= start_dt)

    if end:
        try:
            end_dt = datetime.fromisoformat(end)
        except ValueError:
            raise HTTPException(status_code=422, detail="Invalid 'end' datetime format")
        q = q.where(CalendarEvent.start_time <= end_dt)

    if sport:
        q = q.where(CalendarEvent.sport == sport)

    if event_type:
        q = q.where(CalendarEvent.event_type == event_type)

    result = await db.execute(q)
    return result.scalars().all()


@router.post("/", response_model=CalendarEventRead, status_code=201)
async def create_event(body: CalendarEventCreate, db: AsyncSession = Depends(get_db)):
    """Create a new calendar event."""
    end_time = body.end_time
    if end_time is None and body.event_type == "practice":
        end_time = body.start_time + timedelta(minutes=90)

    event = CalendarEvent(
        title=body.title,
        event_type=body.event_type,
        start_time=body.start_time,
        end_time=end_time,
        location=body.location,
        sport=body.sport,
        age_bracket=body.age_bracket,
        team_name=body.team_name,
        notes=body.notes,
        linked_plan_id=body.linked_plan_id,
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.get("/{event_id}", response_model=CalendarEventRead)
async def get_event(event_id: str, db: AsyncSession = Depends(get_db)):
    """Retrieve a single calendar event by ID."""
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    return event


@router.patch("/{event_id}", response_model=CalendarEventRead)
async def update_event(event_id: str, body: CalendarEventUpdate, db: AsyncSession = Depends(get_db)):
    """Partially update a calendar event."""
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")

    patch = body.model_dump(exclude_unset=True)
    for field, value in patch.items():
        setattr(event, field, value)

    event.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=204)
async def delete_event(event_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a calendar event."""
    result = await db.execute(select(CalendarEvent).where(CalendarEvent.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found")
    await db.delete(event)
    await db.commit()
