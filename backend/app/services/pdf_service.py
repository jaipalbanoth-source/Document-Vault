import os
import uuid
import pdfplumber
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024


def save_and_extract(file: UploadFile, user_id: int) -> dict:
    """Validate, save, and extract text from an uploaded PDF."""

    # --- Validate MIME type ---
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Only PDF files are accepted.",
        )

    # --- Read content & validate size ---
    content = file.file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.MAX_FILE_SIZE_MB} MB size limit.",
        )

    # --- Validate PDF magic bytes (%PDF-) ---
    if not content.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File does not appear to be a valid PDF.",
        )

    # --- Save to disk ---
    unique_name = f"{user_id}_{uuid.uuid4().hex}.pdf"
    user_dir = os.path.join(settings.UPLOAD_DIR, str(user_id))
    os.makedirs(user_dir, exist_ok=True)
    file_path = os.path.join(user_dir, unique_name)

    with open(file_path, "wb") as f:
        f.write(content)

    # --- Extract text ---
    extracted_text = ""
    page_count = 0
    try:
        with pdfplumber.open(file_path) as pdf:
            page_count = len(pdf.pages)
            extracted_text = "\n".join(
                (page.extract_text() or "") for page in pdf.pages
            )
    except Exception:
        # Don't fail the upload if parsing fails — store empty text
        extracted_text = ""
        page_count = 0

    return {
        "filename": unique_name,
        "original_name": file.filename or unique_name,
        "file_path": file_path,
        "file_size": len(content),
        "page_count": page_count,
        "extracted_text": extracted_text,
        "mime_type": "application/pdf",
    }


def delete_file(file_path: str) -> None:
    """Remove file from disk if it exists."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        pass