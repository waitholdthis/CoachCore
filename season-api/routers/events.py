from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import icalendar

from database import get_db
from models.user import User
from models.event import Event, RSVP
from schemas.event import (
    EventCreate, EventRead, EventUpdate,
    RSVPCreate, RSVPRead, EventWithRSVPs,
)
from schemas.auth import UserRead
from services.auth_service import get_current_user, get_current_approved_member, require_coach_or_admin
from services.websocket_manager import manager

router = APIRouter(prefix="/api/events", tags=["events"])


async def _build_rsvp_read(rsvp: RSVP, db: AsyncSession) -> RSVPRead:
    user_result = await db.execute(select(User).where(User.id == rsvp.user_id))
    user = user_result.scalar_one()
    return RSVPRead(
        id=rsvp.id,
        event_id=rsvp.event_id,
        user_id=rsvp.user_id,
        status=rsvp.status,
        note=rsvp.note,
        updated_at=rsvp.updated_at,
        user=UserRead.model_validate(user),
    )


@router.get("/teams/{team_id}", response_model=list[EventRead])
async def list_events(
    team_id: str,
    from_: str | None = Query(None, alias="from"),
    to: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_current_approved_member(team_id, current_user, db)

    now = datetime.utcnow()
    if from_:
        start = datetime.fromisoformat(from_)
    else:
        start = now

    if to:
        end = datetime.fromisoformat(to)
    else:
        end = now + timedelta(days=90)

    result = await db.execute(
        select(Event)
        .where(
            Event.team_id == team_id,
            Event.start_time >= start,
            Event.start_time <= end,
        )
        .order_by(Event.start_time.asc())
    )
    events = result.scalars().all()
    return [EventRead.model_validate(e) for e in events]


@router.post("/teams/{team_id}", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    team_id: str,
    body: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_coach_or_admin(team_id, current_user, db)

    event = Event(
        team_id=team_id,
        title=body.title,
        event_type=body.event_type,
        start_time=body.start_time,
        end_time=body.end_time,
        location=body.location,
        notes=body.notes,
        created_by=current_user.id,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)
    return EventRead.model_validate(event)


@router.get("/{event_id}", response_model=EventWithRSVPs)
async def get_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await get_current_approved_member(event.team_id, current_user, db)

    rsvp_result = await db.execute(
        select(RSVP).where(RSVP.event_id == event_id)
    )
    rsvps = rsvp_result.scalars().all()

    rsvp_reads = [await _build_rsvp_read(r, db) for r in rsvps]

    yes_count = sum(1 for r in rsvp_reads if r.status == "yes")
    no_count = sum(1 for r in rsvp_reads if r.status == "no")
    maybe_count = sum(1 for r in rsvp_reads if r.status == "maybe")

    my_rsvp = next((r for r in rsvp_reads if r.user_id == current_user.id), None)

    return EventWithRSVPs(
        **EventRead.model_validate(event).model_dump(),
        rsvps=rsvp_reads,
        yes_count=yes_count,
        no_count=no_count,
        maybe_count=maybe_count,
        my_rsvp=my_rsvp,
    )


@router.patch("/{event_id}", response_model=EventRead)
async def update_event(
    event_id: str,
    body: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await require_coach_or_admin(event.team_id, current_user, db)

    if body.title is not None:
        event.title = body.title
    if body.event_type is not None:
        event.event_type = body.event_type
    if body.start_time is not None:
        event.start_time = body.start_time
    if body.end_time is not None:
        event.end_time = body.end_time
    if body.location is not None:
        event.location = body.location
    if body.notes is not None:
        event.notes = body.notes
    if body.is_cancelled is not None:
        event.is_cancelled = body.is_cancelled
    event.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(event)

    event_read = EventRead.model_validate(event)
    await manager.broadcast_to_team(
        event.team_id,
        "event_updated",
        {"event": event_read.model_dump(mode="json")},
    )

    return event_read


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def cancel_event(
    event_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await require_coach_or_admin(event.team_id, current_user, db)

    event.is_cancelled = True
    event.updated_at = datetime.utcnow()
    await db.flush()

    await manager.broadcast_to_team(
        event.team_id,
        "event_cancelled",
        {"event_id": event_id},
    )


@router.post("/{event_id}/rsvp", response_model=RSVPRead)
async def upsert_rsvp(
    event_id: str,
    body: RSVPCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.status not in ("yes", "no", "maybe"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Status must be yes, no, or maybe",
        )

    event_result = await db.execute(select(Event).where(Event.id == event_id))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await get_current_approved_member(event.team_id, current_user, db)

    rsvp_result = await db.execute(
        select(RSVP).where(
            RSVP.event_id == event_id,
            RSVP.user_id == current_user.id,
        )
    )
    rsvp = rsvp_result.scalar_one_or_none()

    if rsvp:
        rsvp.status = body.status
        rsvp.note = body.note
        rsvp.updated_at = datetime.utcnow()
    else:
        rsvp = RSVP(
            event_id=event_id,
            user_id=current_user.id,
            status=body.status,
            note=body.note,
            updated_at=datetime.utcnow(),
        )
        db.add(rsvp)

    await db.flush()
    await db.refresh(rsvp)

    rsvp_read = await _build_rsvp_read(rsvp, db)

    await manager.broadcast_to_team(
        event.team_id,
        "rsvp_updated",
        {
            "event_id": event_id,
            "rsvp": rsvp_read.model_dump(mode="json"),
        },
    )

    return rsvp_read


@router.get("/teams/{team_id}/ical")
async def export_ical(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_current_approved_member(team_id, current_user, db)

    result = await db.execute(
        select(Event).where(
            Event.team_id == team_id,
            Event.is_cancelled == False,
        ).order_by(Event.start_time.asc())
    )
    events = result.scalars().all()

    cal = icalendar.Calendar()
    cal.add("PRODID", "-//The Season//EN")
    cal.add("VERSION", "2.0")
    cal.add("CALSCALE", "GREGORIAN")

    for ev in events:
        ical_event = icalendar.Event()
        ical_event.add("SUMMARY", ev.title)
        ical_event.add("DTSTART", ev.start_time)
        if ev.end_time:
            ical_event.add("DTEND", ev.end_time)
        if ev.location:
            ical_event.add("LOCATION", ev.location)
        if ev.notes:
            ical_event.add("DESCRIPTION", ev.notes)
        ical_event.add("UID", f"{ev.id}@the-season")
        cal.add_component(ical_event)

    return Response(
        content=cal.to_ical(),
        media_type="text/calendar",
        headers={"Content-Disposition": 'attachment; filename="the-season.ics"'},
    )
