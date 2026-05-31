from pydantic_settings import BaseSettings
from functools import lru_cache
from pathlib import Path


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://coachcore:coachcore@localhost:5432/coachcore"
    database_url_sync: str = "postgresql://coachcore:coachcore@localhost:5432/coachcore"

    openai_api_key: str = ""
    anthropic_api_key: str = ""

    embedding_model: str = "text-embedding-3-large"
    embedding_dimensions: int = 1536

    llm_model: str = "claude-sonnet-4-6"
    llm_fast_model: str = "claude-haiku-4-5-20251001"

    upload_dir: str = "./uploads"
    max_upload_size_mb: int = 50

    api_secret_key: str = "dev-secret-key"
    cors_origins: str = "http://localhost:3000"
    environment: str = "development"

    # OCR quality thresholds
    ocr_confidence_standard: float = 0.90
    ocr_confidence_enhanced: float = 0.70
    ocr_confidence_minimum: float = 0.50

    # Conflict detection
    similarity_threshold: float = 0.82
    ambiguity_threshold: float = 0.65

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def upload_path(self) -> Path:
        path = Path(self.upload_dir)
        path.mkdir(parents=True, exist_ok=True)
        return path

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()
