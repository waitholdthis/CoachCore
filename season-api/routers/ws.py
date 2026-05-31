from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from database import AsyncSessionLocal
from config import get_settings
from models.team import TeamMember
from services.auth_service import decode_token
from services.websocket_manager import manager

router = APIRouter(prefix="/ws", tags=["websocket"])


@router.websocket("/teams/{team_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    team_id: str,
    token: str = Query(...),
):
    settings = get_settings()

    try:
        user_id = decode_token(token, settings)
    except Exception:
        await websocket.close(code=4001, reason="Invalid token")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id,
                TeamMember.user_id == user_id,
                TeamMember.is_approved == True,
            )
        )
        member = result.scalar_one_or_none()

    if not member:
        await websocket.close(code=4003, reason="Not an approved member of this team")
        return

    await manager.connect(websocket, team_id, user_id)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
                if data.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        manager.disconnect(team_id, user_id)
    except Exception:
        manager.disconnect(team_id, user_id)
