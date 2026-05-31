from fastapi import WebSocket
from collections import defaultdict
import json


class ConnectionManager:
    def __init__(self):
        # team_id -> user_id -> websocket
        self.team_connections: dict[str, dict[str, WebSocket]] = defaultdict(dict)

    async def connect(self, websocket: WebSocket, team_id: str, user_id: str) -> None:
        await websocket.accept()
        self.team_connections[team_id][user_id] = websocket

    def disconnect(self, team_id: str, user_id: str) -> None:
        if team_id in self.team_connections:
            self.team_connections[team_id].pop(user_id, None)
            if not self.team_connections[team_id]:
                del self.team_connections[team_id]

    async def broadcast_to_team(
        self, team_id: str, event_type: str, data: dict
    ) -> None:
        payload = json.dumps({"type": event_type, **data})
        connections = dict(self.team_connections.get(team_id, {}))
        dead = []
        for user_id, ws in connections.items():
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(user_id)
        for user_id in dead:
            self.disconnect(team_id, user_id)

    async def send_to_user(
        self, team_id: str, user_id: str, event_type: str, data: dict
    ) -> None:
        ws = self.team_connections.get(team_id, {}).get(user_id)
        if ws:
            payload = json.dumps({"type": event_type, **data})
            try:
                await ws.send_text(payload)
            except Exception:
                self.disconnect(team_id, user_id)


manager = ConnectionManager()
