from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from services.storage import ensure_bucket_exists
from config import get_settings
from routers import auth, teams, messages, events, uploads, ws


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    try:
        ensure_bucket_exists(settings)
    except Exception as e:
        print(f"MinIO not available: {e}")
    yield


app = FastAPI(title="The Season API", version="1.0.0", lifespan=lifespan)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(messages.router)
app.include_router(events.router)
app.include_router(uploads.router)
app.include_router(ws.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "the-season"}
