from datetime import datetime
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from config import get_settings, Settings
from models.user import User
from models.upload import Upload, ContentReport
from schemas.upload import (
    PresignRequest, PresignResponse, UploadConfirm,
    UploadRead, UploadWithUrl, ReportCreate,
)
from schemas.auth import UserRead
from services.auth_service import get_current_user, get_current_approved_member, require_coach_or_admin
from services.storage import (
    get_presigned_upload_url,
    get_presigned_download_url,
    delete_object,
    generate_s3_key,
    generate_thumbnail,
)
from services.moderation import check_filename, get_file_type
from services.websocket_manager import manager

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


async def _build_upload_with_url(upload: Upload, settings: Settings, db: AsyncSession) -> UploadWithUrl:
    user_result = await db.execute(select(User).where(User.id == upload.uploader_id))
    uploader = user_result.scalar_one()

    url = get_presigned_download_url(upload.s3_key, settings)
    thumbnail_url = None
    if upload.thumbnail_key:
        thumbnail_url = get_presigned_download_url(upload.thumbnail_key, settings)

    return UploadWithUrl(
        id=upload.id,
        team_id=upload.team_id,
        uploader_id=upload.uploader_id,
        s3_key=upload.s3_key,
        thumbnail_key=upload.thumbnail_key,
        original_filename=upload.original_filename,
        file_type=upload.file_type,
        content_type=upload.content_type,
        file_size=upload.file_size,
        season_label=upload.season_label,
        caption=upload.caption,
        upload_confirmed=upload.upload_confirmed,
        moderation_status=upload.moderation_status,
        created_at=upload.created_at,
        uploader=UserRead.model_validate(uploader),
        url=url,
        thumbnail_url=thumbnail_url,
    )


@router.post("/teams/{team_id}/presign", response_model=PresignResponse, status_code=status.HTTP_201_CREATED)
async def presign_upload(
    team_id: str,
    body: PresignRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    await get_current_approved_member(team_id, current_user, db)

    if not check_filename(body.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File type not allowed",
        )

    file_type = get_file_type(body.content_type, body.filename)
    s3_key = generate_s3_key(team_id, file_type, body.filename)

    presigned_url = get_presigned_upload_url(s3_key, body.content_type, settings)

    upload = Upload(
        team_id=team_id,
        uploader_id=current_user.id,
        s3_key=s3_key,
        original_filename=body.filename,
        file_type=file_type,
        content_type=body.content_type,
        file_size=body.file_size,
        upload_confirmed=False,
        moderation_status="approved",
    )
    db.add(upload)
    await db.flush()
    await db.refresh(upload)

    return PresignResponse(
        upload_id=upload.id,
        presigned_url=presigned_url,
        s3_key=s3_key,
    )


@router.post("/{upload_id}/confirm", response_model=UploadWithUrl)
async def confirm_upload(
    upload_id: str,
    body: UploadConfirm,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    result = await db.execute(select(Upload).where(Upload.id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    if upload.uploader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only confirm your own uploads",
        )

    await get_current_approved_member(upload.team_id, current_user, db)

    upload.upload_confirmed = True
    if body.caption is not None:
        upload.caption = body.caption
    if body.season_label is not None:
        upload.season_label = body.season_label

    await db.flush()
    await db.refresh(upload)

    if upload.file_type == "photo":
        background_tasks.add_task(generate_thumbnail, upload.s3_key, upload.id, settings, db)

    upload_read = UploadRead(
        id=upload.id,
        team_id=upload.team_id,
        uploader_id=upload.uploader_id,
        s3_key=upload.s3_key,
        thumbnail_key=upload.thumbnail_key,
        original_filename=upload.original_filename,
        file_type=upload.file_type,
        content_type=upload.content_type,
        file_size=upload.file_size,
        season_label=upload.season_label,
        caption=upload.caption,
        upload_confirmed=upload.upload_confirmed,
        moderation_status=upload.moderation_status,
        created_at=upload.created_at,
        uploader=UserRead.model_validate(
            (await db.execute(select(User).where(User.id == upload.uploader_id))).scalar_one()
        ),
    )

    await manager.broadcast_to_team(
        upload.team_id,
        "new_upload",
        {"upload": upload_read.model_dump(mode="json")},
    )

    return await _build_upload_with_url(upload, settings, db)


@router.get("/teams/{team_id}", response_model=list[UploadWithUrl])
async def list_uploads(
    team_id: str,
    file_type: str | None = None,
    season_label: str | None = None,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    await get_current_approved_member(team_id, current_user, db)

    query = select(Upload).where(
        Upload.team_id == team_id,
        Upload.upload_confirmed == True,
        Upload.moderation_status != "removed",
    )

    if file_type:
        query = query.where(Upload.file_type == file_type)
    if season_label:
        query = query.where(Upload.season_label == season_label)

    query = query.order_by(Upload.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    uploads = result.scalars().all()

    return [await _build_upload_with_url(u, settings, db) for u in uploads]


@router.get("/{upload_id}/url", response_model=UploadWithUrl)
async def get_upload_url(
    upload_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    result = await db.execute(select(Upload).where(Upload.id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    await get_current_approved_member(upload.team_id, current_user, db)

    return await _build_upload_with_url(upload, settings, db)


@router.delete("/{upload_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_upload(
    upload_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
):
    result = await db.execute(select(Upload).where(Upload.id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    if upload.uploader_id != current_user.id:
        await require_coach_or_admin(upload.team_id, current_user, db)
    else:
        await get_current_approved_member(upload.team_id, current_user, db)

    delete_object(upload.s3_key, settings)
    if upload.thumbnail_key:
        delete_object(upload.thumbnail_key, settings)

    await db.delete(upload)


@router.post("/{upload_id}/report", status_code=status.HTTP_201_CREATED)
async def report_upload(
    upload_id: str,
    body: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Upload).where(Upload.id == upload_id))
    upload = result.scalar_one_or_none()
    if not upload:
        raise HTTPException(status_code=404, detail="Upload not found")

    await get_current_approved_member(upload.team_id, current_user, db)

    report = ContentReport(
        reporter_id=current_user.id,
        content_type="upload",
        content_id=upload_id,
        reason=body.reason,
        status="open",
        created_at=datetime.utcnow(),
    )
    db.add(report)

    upload.moderation_status = "flagged"
    await db.flush()

    return {"detail": "Report submitted"}
