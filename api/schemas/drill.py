from pydantic import BaseModel, ConfigDict
from typing import Any
from datetime import datetime


class DrillRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    sport: str
    skill_focus: str
    difficulty: str
    duration_minutes: int
    player_count_min: int | None
    player_count_max: int | None
    description: str
    setup: str | None
    instructions: list[Any]
    coaching_points: list[Any]
    progressions: list[Any]
    equipment: list[Any]
    tags: list[Any]
    age_brackets: list[Any]
    is_featured: bool
    created_at: datetime


class DrillCreate(BaseModel):
    title: str
    sport: str
    skill_focus: str
    difficulty: str = "beginner"
    duration_minutes: int = 15
    player_count_min: int | None = None
    player_count_max: int | None = None
    description: str
    setup: str | None = None
    instructions: list[Any] = []
    coaching_points: list[Any] = []
    progressions: list[Any] = []
    equipment: list[Any] = []
    tags: list[Any] = []
    age_brackets: list[Any] = []
    is_featured: bool = False


class PracticeTemplateRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    sport: str
    age_bracket: str
    difficulty: str
    duration_minutes: int
    player_count_min: int | None
    player_count_max: int | None
    description: str
    overview: str | None
    phases: list[Any]
    equipment_list: list[Any]
    tags: list[Any]
    is_featured: bool
    created_at: datetime


class PracticeTemplateCreate(BaseModel):
    title: str
    sport: str
    age_bracket: str
    difficulty: str = "beginner"
    duration_minutes: int = 90
    player_count_min: int | None = None
    player_count_max: int | None = None
    description: str
    overview: str | None = None
    phases: list[Any] = []
    equipment_list: list[Any] = []
    tags: list[Any] = []
    is_featured: bool = False
