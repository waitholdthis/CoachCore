import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db

from models.user import User
from models.team import Team, TeamMember
from models.message import Channel
from schemas.team import (
    TeamCreate, TeamRead, TeamMemberRead, MemberUpdate,
    JoinRequest, TeamWithMeta,
)
from schemas.auth import UserRead
from services.auth_service import get_current_user, get_current_approved_member, require_coach_or_admin
from services.websocket_manager import manager

router = APIRouter(prefix="/api/teams", tags=["teams"])


@router.post("/", response_model=TeamRead, status_code=status.HTTP_201_CREATED)
async def create_team(
    body: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    invite_code = secrets.token_urlsafe(6)[:8]

    team = Team(
        name=body.name,
        sport=body.sport,
        season_name=body.season_name,
        season_start=body.season_start,
        season_end=body.season_end,
        invite_code=invite_code,
        created_by=current_user.id,
    )
    db.add(team)
    await db.flush()

    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role="admin",
        is_approved=True,
        approved_at=datetime.utcnow(),
        approved_by=current_user.id,
    )
    db.add(member)

    team_chat = Channel(
        team_id=team.id,
        channel_type="team_chat",
        name="Team Chat",
    )
    announcements = Channel(
        team_id=team.id,
        channel_type="announcements",
        name="Announcements",
    )
    db.add(team_chat)
    db.add(announcements)

    await db.flush()
    await db.refresh(team)
    return TeamRead.model_validate(team)


@router.get("/my", response_model=list[TeamWithMeta])
async def get_my_teams(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TeamMember).where(
            TeamMember.user_id == current_user.id,
            TeamMember.is_approved == True,
        )
    )
    memberships = result.scalars().all()

    teams_with_meta = []
    for membership in memberships:
        team_result = await db.execute(select(Team).where(Team.id == membership.team_id))
        team = team_result.scalar_one_or_none()
        if not team:
            continue

        count_result = await db.execute(
            select(func.count()).select_from(TeamMember).where(
                TeamMember.team_id == team.id,
                TeamMember.is_approved == True,
            )
        )
        member_count = count_result.scalar_one()

        teams_with_meta.append(
            TeamWithMeta(
                **TeamRead.model_validate(team).model_dump(),
                member_count=member_count,
                my_role=membership.role,
            )
        )

    return teams_with_meta


@router.get("/{team_id}", response_model=TeamWithMeta)
async def get_team(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await get_current_approved_member(team_id, current_user, db)

    team_result = await db.execute(select(Team).where(Team.id == team_id))
    team = team_result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    count_result = await db.execute(
        select(func.count()).select_from(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.is_approved == True,
        )
    )
    member_count = count_result.scalar_one()

    return TeamWithMeta(
        **TeamRead.model_validate(team).model_dump(),
        member_count=member_count,
        my_role=member.role,
    )


@router.patch("/{team_id}", response_model=TeamRead)
async def update_team(
    team_id: str,
    body: TeamCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_coach_or_admin(team_id, current_user, db)

    team_result = await db.execute(select(Team).where(Team.id == team_id))
    team = team_result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    team.name = body.name
    if body.sport is not None:
        team.sport = body.sport
    if body.season_name is not None:
        team.season_name = body.season_name
    if body.season_start is not None:
        team.season_start = body.season_start
    if body.season_end is not None:
        team.season_end = body.season_end
    team.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(team)
    return TeamRead.model_validate(team)


@router.post("/join", response_model=TeamMemberRead)
async def join_team(
    body: JoinRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    team_result = await db.execute(
        select(Team).where(Team.invite_code.ilike(body.invite_code))
    )
    team = team_result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    existing = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team.id,
            TeamMember.user_id == current_user.id,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this team",
        )

    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role="parent",
        is_approved=False,
    )
    db.add(member)
    await db.flush()
    await db.refresh(member)

    await manager.broadcast_to_team(
        team.id,
        "member_joined",
        {"team_id": team.id, "user_id": current_user.id},
    )

    user_read = UserRead.model_validate(current_user)
    return TeamMemberRead(
        id=member.id,
        team_id=member.team_id,
        user_id=member.user_id,
        role=member.role,
        child_names=member.child_names or [],
        is_approved=member.is_approved,
        joined_at=member.joined_at,
        user=user_read,
    )


@router.get("/{team_id}/members", response_model=list[TeamMemberRead])
async def list_members(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await get_current_approved_member(team_id, current_user, db)

    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id)
    )
    members = result.scalars().all()

    output = []
    for m in members:
        user_result = await db.execute(select(User).where(User.id == m.user_id))
        user = user_result.scalar_one_or_none()
        if not user:
            continue
        output.append(
            TeamMemberRead(
                id=m.id,
                team_id=m.team_id,
                user_id=m.user_id,
                role=m.role,
                child_names=m.child_names or [],
                is_approved=m.is_approved,
                joined_at=m.joined_at,
                user=UserRead.model_validate(user),
            )
        )

    role_order = {"admin": 0, "coach": 1, "parent": 2}
    output.sort(key=lambda x: (role_order.get(x.role, 3), x.user.last_name, x.user.first_name))
    return output


@router.patch("/{team_id}/members/{user_id}", response_model=TeamMemberRead)
async def update_member(
    team_id: str,
    user_id: str,
    body: MemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_coach_or_admin(team_id, current_user, db)

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    was_approved = member.is_approved
    if body.is_approved is not None:
        member.is_approved = body.is_approved
        if body.is_approved and not was_approved:
            member.approved_at = datetime.utcnow()
            member.approved_by = current_user.id
    if body.role is not None:
        member.role = body.role
    if body.child_names is not None:
        member.child_names = body.child_names

    await db.flush()

    if body.is_approved and not was_approved:
        await manager.broadcast_to_team(
            team_id,
            "member_approved",
            {"team_id": team_id, "user_id": user_id},
        )

    await db.refresh(member)
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()

    return TeamMemberRead(
        id=member.id,
        team_id=member.team_id,
        user_id=member.user_id,
        role=member.role,
        child_names=member.child_names or [],
        is_approved=member.is_approved,
        joined_at=member.joined_at,
        user=UserRead.model_validate(user),
    )


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    team_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Allow self-leave or coach/admin removal
    if current_user.id != user_id:
        await require_coach_or_admin(team_id, current_user, db)
    else:
        # Self-leave: ensure user is a member
        result = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id,
                TeamMember.user_id == user_id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Member not found")

    result = await db.execute(
        select(TeamMember).where(
            TeamMember.team_id == team_id,
            TeamMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)


@router.post("/{team_id}/invite/reset", response_model=TeamRead)
async def reset_invite_code(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await require_coach_or_admin(team_id, current_user, db)

    team_result = await db.execute(select(Team).where(Team.id == team_id))
    team = team_result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    team.invite_code = secrets.token_urlsafe(6)[:8]
    team.updated_at = datetime.utcnow()

    await db.flush()
    await db.refresh(team)
    return TeamRead.model_validate(team)
