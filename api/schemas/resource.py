from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Any


class ResourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    body: str
    resource_type: str
    sport: str | None
    tags: list[Any]
    is_featured: bool
    read_time_minutes: int | None
    created_at: datetime


class ResourceCreate(BaseModel):
    title: str
    body: str
    resource_type: str = "tip"
    sport: str | None = None
    tags: list[str] = []
    is_featured: bool = False
    read_time_minutes: int | None = None


class SavedItemCreate(BaseModel):
    item_type: str
    item_id: str
    title: str
    notes: str | None = None


class SavedItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    item_type: str
    item_id: str
    title: str
    notes: str | None
    created_at: datetime
