from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import get_settings
from database import engine, Base

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure upload directory exists on startup
    settings.upload_path.mkdir(parents=True, exist_ok=True)
    yield
    await engine.dispose()


app = FastAPI(
    title="CoachCore API",
    description="Smart Rulebook for Youth Sports",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads for direct file access (development only)
if settings.environment == "development":
    app.mount("/uploads", StaticFiles(directory=str(settings.upload_path)), name="uploads")

# Routers
from routers import leagues, rules, ingest, chat, diff  # noqa: E402
from routers.practice import router as practice_router  # noqa: E402
from routers.conditioning import router as conditioning_router  # noqa: E402
from routers.gameplan import router as gameplan_router  # noqa: E402

app.include_router(leagues.router, prefix="/api/leagues", tags=["leagues"])
app.include_router(rules.router, prefix="/api/rules", tags=["rules"])
app.include_router(ingest.router, prefix="/api/ingest", tags=["ingest"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(diff.router, prefix="/api/diff", tags=["diff"])
app.include_router(practice_router)
app.include_router(conditioning_router)
app.include_router(gameplan_router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
