from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    season_database_url: str = "postgresql+asyncpg://season:season@localhost:5432/the_season"
    season_database_url_sync: str = "postgresql://season:season@localhost:5432/the_season"
    season_jwt_secret: str = "dev-season-secret-change-in-prod"
    season_jwt_expire_minutes: int = 10080  # 7 days
    minio_endpoint: str = "localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "the-season"
    minio_use_ssl: bool = False
    cors_origins: str = "http://localhost:3002"
    environment: str = "development"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


get_settings = lru_cache()(lambda: Settings())
