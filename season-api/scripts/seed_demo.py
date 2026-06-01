"""Seed a polished Falcons U10 demo team for The Season.

This script creates a safe demo account and believable youth-sports season data for
local/staging product demos. It is idempotent: rerunning it updates/creates the
same demo users, team, channels, messages, events, RSVPs, and file records.

Usage from /root/CoachCore/season-api:
    python3 scripts/seed_demo.py --dry-run
    python3 scripts/seed_demo.py

Environment:
    SEASON_DATABASE_URL must point at a migrated The Season database.
    SEASON_DEMO_PASSWORD optionally overrides the default local demo password.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

# Allow running this file directly from the repo root or season-api directory.
API_ROOT = Path(__file__).resolve().parents[1]
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))


def load_runtime_dependencies() -> dict[str, Any]:
    """Import database dependencies only when a real seed run is requested.

    This keeps --dry-run useful on fresh machines before backend dependencies are
    installed, while the actual seed path still fails loudly if the API runtime is
    not ready.
    """

    from sqlalchemy import delete, select

    from database import AsyncSessionLocal
    from models.event import Event, RSVP
    from models.message import Channel, Message, ReadReceipt
    from models.team import Team, TeamMember
    from models.upload import Upload
    from models.user import User
    from services.auth_service import hash_password

    return locals()

DEMO_PASSWORD = os.getenv("SEASON_DEMO_PASSWORD", "TheSeasonDemo!2026")
DEMO_INVITE_CODE = "FALCONU10"
DEMO_TEAM_NAME = "Falcons U10"
DEMO_SEASON_LABEL = "Spring 2026"


@dataclass(frozen=True)
class DemoUser:
    email: str
    first_name: str
    last_name: str
    phone: str | None
    role: str
    child_names: list[str]
    approved: bool = True


DEMO_USERS = [
    DemoUser("demo-coach@theseason.local", "Coach", "Parker", "555-0100", "coach", []),
    DemoUser("maya.rivera@theseason.local", "Maya", "Rivera", "555-0101", "parent", ["Jaxon"]),
    DemoUser("darius.carter@theseason.local", "Darius", "Carter", "555-0102", "parent", ["Ava"]),
    DemoUser("jen.wilson@theseason.local", "Jen", "Wilson", "555-0103", "parent", ["Liam"]),
    DemoUser("sam.taylor@theseason.local", "Sam", "Taylor", "555-0104", "parent", ["Noah"]),
    DemoUser("nina.brooks@theseason.local", "Nina", "Brooks", "555-0105", "parent", ["Mia"]),
    DemoUser("leo.howard@theseason.local", "Leo", "Howard", "555-0106", "parent", ["Eli"]),
    DemoUser("pending.parent@theseason.local", "Casey", "Morgan", "555-0107", "parent", ["Riley"], approved=False),
]

MESSAGES = [
    ("demo-coach@theseason.local", "Reminder: blue jerseys Saturday. Please RSVP by tonight so we can lock rotations.", -7),
    ("maya.rivera@theseason.local", "Jaxon is confirmed. We can bring fruit and waters.", -6),
    ("darius.carter@theseason.local", "Ava may be 10 minutes late to practice, but she is in for the game.", -5),
    ("demo-coach@theseason.local", "All good. I uploaded the rotation sheet under Team Files.", -4),
    ("jen.wilson@theseason.local", "Liam is in for Saturday. We can help with cones after warmups.", -3),
    ("demo-coach@theseason.local", "Thank you. Final reminder goes out tomorrow morning.", -2),
]

EVENTS = [
    {
        "title": "Footwork + small-sided practice",
        "event_type": "practice",
        "start_offset_days": 1,
        "hour": 18,
        "duration_hours": 1.5,
        "location": "Field 3",
        "notes": "Bring cleats, water, and blue practice tops.",
    },
    {
        "title": "Falcons vs. Tigers",
        "event_type": "game",
        "start_offset_days": 4,
        "hour": 9,
        "duration_hours": 1.25,
        "location": "Northside Park · Field 2",
        "notes": "Arrive 30 minutes early. Blue jerseys. Rotation sheet is in Team Files.",
    },
    {
        "title": "Snack signup closes",
        "event_type": "other",
        "start_offset_days": 5,
        "hour": 16,
        "duration_hours": 0.25,
        "location": "The Season",
        "notes": "Parents should claim remaining snack and water slots before Sunday afternoon.",
    },
]

UPLOADS = [
    ("game-day-rotation-sheet.pdf", "document", "application/pdf", 216_000, "Game-day rotation sheet"),
    ("field-map.png", "photo", "image/png", 1_400_000, "Field map for Saturday"),
    ("parent-snack-signup.pdf", "document", "application/pdf", 98_000, "Parent snack signup"),
]


async def get_or_create_user(session: AsyncSession, demo_user: DemoUser) -> User:
    result = await session.execute(select(User).where(User.email == demo_user.email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(
            email=demo_user.email,
            first_name=demo_user.first_name,
            last_name=demo_user.last_name,
            phone=demo_user.phone,
            password_hash=hash_password(DEMO_PASSWORD),
            is_active=True,
        )
        session.add(user)
        await session.flush()
        return user

    user.first_name = demo_user.first_name
    user.last_name = demo_user.last_name
    user.phone = demo_user.phone
    user.is_active = True
    return user


async def get_or_create_team(session: AsyncSession, coach: User) -> Team:
    result = await session.execute(select(Team).where(Team.invite_code == DEMO_INVITE_CODE))
    team = result.scalar_one_or_none()
    if team is None:
        team = Team(
            name=DEMO_TEAM_NAME,
            sport="Soccer",
            season_name=DEMO_SEASON_LABEL,
            season_start=datetime(2026, 3, 1).date(),
            season_end=datetime(2026, 6, 1).date(),
            invite_code=DEMO_INVITE_CODE,
            created_by=coach.id,
        )
        session.add(team)
        await session.flush()
        return team

    team.name = DEMO_TEAM_NAME
    team.sport = "Soccer"
    team.season_name = DEMO_SEASON_LABEL
    team.season_start = datetime(2026, 3, 1).date()
    team.season_end = datetime(2026, 6, 1).date()
    team.created_by = coach.id
    return team


async def upsert_member(
    session: AsyncSession,
    team: Team,
    user: User,
    demo_user: DemoUser,
    coach: User,
) -> TeamMember:
    result = await session.execute(
        select(TeamMember).where(TeamMember.team_id == team.id, TeamMember.user_id == user.id)
    )
    member = result.scalar_one_or_none()
    approved_at = datetime.utcnow() if demo_user.approved else None
    if member is None:
        member = TeamMember(
            team_id=team.id,
            user_id=user.id,
            role=demo_user.role,
            child_names=demo_user.child_names,
            is_approved=demo_user.approved,
            approved_at=approved_at,
            approved_by=coach.id if demo_user.approved else None,
        )
        session.add(member)
        await session.flush()
        return member

    member.role = demo_user.role
    member.child_names = demo_user.child_names
    member.is_approved = demo_user.approved
    member.approved_at = approved_at
    member.approved_by = coach.id if demo_user.approved else None
    return member


async def reset_team_demo_content(session: AsyncSession, team: Team) -> None:
    channel_ids = [
        row[0]
        for row in (
            await session.execute(select(Channel.id).where(Channel.team_id == team.id))
        ).all()
    ]
    event_ids = [
        row[0]
        for row in (
            await session.execute(select(Event.id).where(Event.team_id == team.id))
        ).all()
    ]

    if channel_ids:
        await session.execute(delete(ReadReceipt).where(ReadReceipt.channel_id.in_(channel_ids)))
        await session.execute(delete(Message).where(Message.channel_id.in_(channel_ids)))
        await session.execute(delete(Channel).where(Channel.id.in_(channel_ids)))
    if event_ids:
        await session.execute(delete(RSVP).where(RSVP.event_id.in_(event_ids)))
        await session.execute(delete(Event).where(Event.id.in_(event_ids)))
    await session.execute(delete(Upload).where(Upload.team_id == team.id))
    await session.flush()


async def seed_demo() -> dict[str, int | str]:
    globals().update(load_runtime_dependencies())

    async with AsyncSessionLocal() as session:
        users_by_email: dict[str, User] = {}
        for demo_user in DEMO_USERS:
            users_by_email[demo_user.email] = await get_or_create_user(session, demo_user)

        coach = users_by_email["demo-coach@theseason.local"]
        team = await get_or_create_team(session, coach)

        for demo_user in DEMO_USERS:
            await upsert_member(session, team, users_by_email[demo_user.email], demo_user, coach)

        await reset_team_demo_content(session, team)

        team_chat = Channel(team_id=team.id, channel_type="team_chat", name="Team Chat")
        announcements = Channel(team_id=team.id, channel_type="announcements", name="Announcements")
        session.add_all([team_chat, announcements])
        await session.flush()

        now = datetime.utcnow()
        for sender_email, content, minute_offset in MESSAGES:
            session.add(
                Message(
                    channel_id=team_chat.id,
                    sender_id=users_by_email[sender_email].id,
                    content=content,
                    created_at=now + timedelta(minutes=minute_offset),
                )
            )

        session.add(
            Message(
                channel_id=announcements.id,
                sender_id=coach.id,
                content="Saturday plan is posted: arrive by 9:00 AM, blue jerseys, and check Team Files for the rotation sheet.",
                created_at=now - timedelta(minutes=1),
            )
        )

        events: list[Event] = []
        for spec in EVENTS:
            start = (now + timedelta(days=spec["start_offset_days"])).replace(
                hour=spec["hour"], minute=0, second=0, microsecond=0
            )
            event = Event(
                team_id=team.id,
                title=spec["title"],
                event_type=spec["event_type"],
                start_time=start,
                end_time=start + timedelta(hours=spec["duration_hours"]),
                location=spec["location"],
                notes=spec["notes"],
                created_by=coach.id,
            )
            session.add(event)
            events.append(event)
        await session.flush()

        game = next(event for event in events if event.event_type == "game")
        rsvp_statuses = {
            "maya.rivera@theseason.local": ("yes", "Bringing waters."),
            "darius.carter@theseason.local": ("maybe", "Ava may be 10 minutes late."),
            "jen.wilson@theseason.local": ("yes", "We can help with cones."),
            "sam.taylor@theseason.local": ("yes", "Noah is ready."),
            "nina.brooks@theseason.local": ("yes", "Mia is in."),
            "leo.howard@theseason.local": ("no", "Eli is out this weekend."),
        }
        for email, (status, note) in rsvp_statuses.items():
            session.add(
                RSVP(
                    event_id=game.id,
                    user_id=users_by_email[email].id,
                    status=status,
                    note=note,
                )
            )

        for filename, file_type, content_type, file_size, caption in UPLOADS:
            session.add(
                Upload(
                    team_id=team.id,
                    uploader_id=coach.id,
                    s3_key=f"demo/{team.invite_code}/{filename}",
                    original_filename=filename,
                    file_type=file_type,
                    content_type=content_type,
                    file_size=file_size,
                    season_label=DEMO_SEASON_LABEL,
                    caption=caption,
                    upload_confirmed=True,
                    moderation_status="approved",
                )
            )

        await session.commit()
        return {
            "team": team.name,
            "invite_code": team.invite_code,
            "demo_login": coach.email,
            "users": len(DEMO_USERS),
            "channels": 2,
            "messages": len(MESSAGES) + 1,
            "events": len(EVENTS),
            "rsvps": len(rsvp_statuses),
            "uploads": len(UPLOADS),
        }


def print_plan() -> None:
    print("The Season demo seed plan")
    print(f"  Team: {DEMO_TEAM_NAME} ({DEMO_SEASON_LABEL})")
    print(f"  Invite code: {DEMO_INVITE_CODE}")
    print("  Demo coach login: demo-coach@theseason.local")
    print("  Password: set SEASON_DEMO_PASSWORD or use the local default")
    print(f"  Users: {len(DEMO_USERS)}")
    print(f"  Messages: {len(MESSAGES) + 1}")
    print(f"  Events: {len(EVENTS)}")
    print(f"  Upload records: {len(UPLOADS)}")


async def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Falcons U10 demo data for The Season.")
    parser.add_argument("--dry-run", action="store_true", help="Print what would be seeded without touching the database.")
    args = parser.parse_args()

    if args.dry_run:
        print_plan()
        return

    result = await seed_demo()
    print("Seeded The Season demo data")
    for key, value in result.items():
        print(f"  {key}: {value}")


if __name__ == "__main__":
    asyncio.run(main())
