import boto3
import io
import uuid
import re
from botocore.config import Config
from botocore.exceptions import ClientError
from config import Settings


def get_s3_client(settings: Settings):
    return boto3.client(
        "s3",
        endpoint_url=f"{'https' if settings.minio_use_ssl else 'http'}://{settings.minio_endpoint}",
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def ensure_bucket_exists(settings: Settings) -> None:
    s3 = get_s3_client(settings)
    try:
        s3.head_bucket(Bucket=settings.minio_bucket)
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        if error_code in ("404", "NoSuchBucket"):
            s3.create_bucket(Bucket=settings.minio_bucket)
        else:
            raise


def get_presigned_upload_url(
    s3_key: str, content_type: str, settings: Settings, expires: int = 3600
) -> str:
    s3 = get_s3_client(settings)
    return s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.minio_bucket,
            "Key": s3_key,
            "ContentType": content_type,
        },
        ExpiresIn=expires,
    )


def get_presigned_download_url(
    s3_key: str, settings: Settings, expires: int = 3600
) -> str:
    s3 = get_s3_client(settings)
    return s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.minio_bucket, "Key": s3_key},
        ExpiresIn=expires,
    )


def delete_object(s3_key: str, settings: Settings) -> None:
    s3 = get_s3_client(settings)
    try:
        s3.delete_object(Bucket=settings.minio_bucket, Key=s3_key)
    except ClientError:
        pass


def generate_s3_key(team_id: str, file_type: str, filename: str) -> str:
    safe_filename = re.sub(r"[^\w.\-]", "_", filename)
    unique_id = str(uuid.uuid4())
    folder = f"{file_type}s"  # photos, videos, documents
    return f"teams/{team_id}/{folder}/{unique_id}_{safe_filename}"


async def generate_thumbnail(
    s3_key: str, upload_id: str, settings: Settings, db
) -> str | None:
    try:
        from PIL import Image
        from sqlalchemy import select
        from models.upload import Upload

        s3 = get_s3_client(settings)

        response = s3.get_object(Bucket=settings.minio_bucket, Key=s3_key)
        image_data = response["Body"].read()

        img = Image.open(io.BytesIO(image_data))
        img.thumbnail((400, 400), Image.LANCZOS)

        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")

        thumb_buffer = io.BytesIO()
        img.save(thumb_buffer, format="JPEG", quality=85)
        thumb_buffer.seek(0)

        thumbnail_key = f"{s3_key}_thumb.jpg"
        s3.put_object(
            Bucket=settings.minio_bucket,
            Key=thumbnail_key,
            Body=thumb_buffer.getvalue(),
            ContentType="image/jpeg",
        )

        result = await db.execute(select(Upload).where(Upload.id == upload_id))
        upload = result.scalar_one_or_none()
        if upload:
            upload.thumbnail_key = thumbnail_key
            await db.commit()

        return thumbnail_key

    except Exception as e:
        print(f"Thumbnail generation failed for {s3_key}: {e}")
        return None
