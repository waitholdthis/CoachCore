from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
from schemas.auth import UserRead

MAX_FILE_SIZE = 104857600  # 100 MB


class PresignRequest(BaseModel):
    filename: str
    content_type: str
    file_size: int

    @field_validator("file_size")
    @classmethod
    def validate_file_size(cls, v: int) -> int:
        if v > MAX_FILE_SIZE:
            raise ValueError(f"File size exceeds 100MB limit ({MAX_FILE_SIZE} bytes)")
        return v


class PresignResponse(BaseModel):
    upload_id: UUID
    presigned_url: str
    s3_key: str


class UploadConfirm(BaseModel):
    caption: Optional[str] = None
    season_label: Optional[str] = None


class UploadRead(BaseModel):
    id: str
    team_id: str
    uploader_id: str
    s3_key: str
    thumbnail_key: Optional[str] = None
    original_filename: str
    file_type: str
    content_type: str
    file_size: int
    season_label: Optional[str] = None
    caption: Optional[str] = None
    upload_confirmed: bool
    moderation_status: str
    created_at: datetime
    uploader: UserRead

    model_config = ConfigDict(from_attributes=True)


class UploadWithUrl(UploadRead):
    url: str
    thumbnail_url: Optional[str] = None


class ReportCreate(BaseModel):
    reason: str
