from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.exc import IntegrityError

from database import get_db
from models.roster import Player, RosterTeam, RosterTeamPlayer
from schemas.roster import (
    PlayerCreate,
    PlayerUpdate,
    PlayerRead,
    RosterTeamCreate,
    RosterTeamUpdate,
    RosterTeamRead,
    RosterTeamWithPlayers,
)

router = APIRouter(prefix="/api/roster", tags=["roster"])


# ── Teams ──────────────────────────────────────────────────────────────────────

@router.get("/teams", response_model=list[RosterTeamRead])
async def list_teams(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RosterTeam).order_by(desc(RosterTeam.created_at)))
    return result.scalars().all()


@router.post("/teams", response_model=RosterTeamRead, status_code=201)
async def create_team(body: RosterTeamCreate, db: AsyncSession = Depends(get_db)):
    team = RosterTeam(
        name=body.name,
        sport=body.sport,
        age_bracket=body.age_bracket,
        season_label=body.season_label,
        head_coach=body.head_coach,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)
    return team


@router.get("/teams/{team_id}", response_model=RosterTeamWithPlayers)
async def get_team(team_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RosterTeam).where(RosterTeam.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Join RosterTeamPlayer → Player
    link_result = await db.execute(
        select(RosterTeamPlayer).where(RosterTeamPlayer.team_id == team.id)
    )
    links = link_result.scalars().all()

    players = []
    for link in links:
        p_result = await db.execute(select(Player).where(Player.id == link.player_id))
        player = p_result.scalar_one_or_none()
        if player:
            players.append(player)

    team_data = RosterTeamRead.model_validate(team).model_dump()
    team_data["players"] = [PlayerRead.model_validate(p) for p in players]
    return RosterTeamWithPlayers(**team_data)


@router.patch("/teams/{team_id}", response_model=RosterTeamRead)
async def update_team(team_id: str, body: RosterTeamUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RosterTeam).where(RosterTeam.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(team, field, value)
    team.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(team)
    return team


@router.delete("/teams/{team_id}", status_code=204)
async def delete_team(team_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RosterTeam).where(RosterTeam.id == team_id))
    team = result.scalar_one_or_none()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    await db.delete(team)
    await db.commit()


# ── Team ↔ Player membership ───────────────────────────────────────────────────

@router.post("/teams/{team_id}/players", status_code=201)
async def add_player_to_team(team_id: str, body: dict, db: AsyncSession = Depends(get_db)):
    player_id = body.get("player_id")
    if not player_id:
        raise HTTPException(status_code=422, detail="player_id is required")

    # Verify team exists
    t_result = await db.execute(select(RosterTeam).where(RosterTeam.id == team_id))
    if not t_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Team not found")

    # Verify player exists
    p_result = await db.execute(select(Player).where(Player.id == player_id))
    if not p_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Player not found")

    link = RosterTeamPlayer(
        team_id=team_id,
        player_id=player_id,
        joined_at=datetime.utcnow(),
    )
    db.add(link)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Player already on this team")

    return {"team_id": team_id, "player_id": player_id}


@router.delete("/teams/{team_id}/players/{player_id}", status_code=204)
async def remove_player_from_team(team_id: str, player_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(RosterTeamPlayer).where(
            RosterTeamPlayer.team_id == team_id,
            RosterTeamPlayer.player_id == player_id,
        )
    )
    link = result.scalar_one_or_none()
    if not link:
        raise HTTPException(status_code=404, detail="Player not on this team")
    await db.delete(link)
    await db.commit()


# ── Players ────────────────────────────────────────────────────────────────────

@router.get("/players", response_model=list[PlayerRead])
async def list_players(sport: str | None = None, db: AsyncSession = Depends(get_db)):
    q = select(Player).order_by(Player.last_name, Player.first_name)
    if sport:
        q = q.where(Player.sport == sport)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/players", response_model=PlayerRead, status_code=201)
async def create_player(body: PlayerCreate, db: AsyncSession = Depends(get_db)):
    now = datetime.utcnow()
    player = Player(
        first_name=body.first_name,
        last_name=body.last_name,
        number=body.number,
        position=body.position,
        age=body.age,
        sport=body.sport,
        notes=body.notes,
        emergency_contact=body.emergency_contact,
        medical_notes=body.medical_notes,
        created_at=now,
        updated_at=now,
    )
    db.add(player)
    await db.commit()
    await db.refresh(player)
    return player


@router.get("/players/{player_id}", response_model=PlayerRead)
async def get_player(player_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


@router.patch("/players/{player_id}", response_model=PlayerRead)
async def update_player(player_id: str, body: PlayerUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")

    for field, value in body.model_dump(exclude_none=True).items():
        setattr(player, field, value)
    player.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(player)
    return player


@router.delete("/players/{player_id}", status_code=204)
async def delete_player(player_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Player).where(Player.id == player_id))
    player = result.scalar_one_or_none()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    await db.delete(player)
    await db.commit()
