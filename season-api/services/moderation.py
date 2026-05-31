import os
from better_profanity import profanity

profanity.load_censor_words()

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".mp4", ".mov", ".m4v",
}

PHOTO_MIME_PREFIXES = ("image/",)
VIDEO_MIME_PREFIXES = ("video/",)
PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v"}


def check_text(content: str) -> tuple[bool, str]:
    """Returns (is_clean, censored_text). is_clean=True if no profanity found."""
    if profanity.contains_profanity(content):
        censored = profanity.censor(content)
        return False, censored
    return True, content


def check_filename(filename: str) -> bool:
    """Returns True if the file extension is allowed."""
    _, ext = os.path.splitext(filename.lower())
    return ext in ALLOWED_EXTENSIONS


def get_file_type(content_type: str, filename: str) -> str:
    """Returns 'photo', 'video', or 'document' based on MIME type and filename."""
    ct = content_type.lower()
    _, ext = os.path.splitext(filename.lower())

    if ct.startswith("image/") or ext in PHOTO_EXTENSIONS:
        return "photo"
    if ct.startswith("video/") or ext in VIDEO_EXTENSIONS:
        return "video"
    return "document"
