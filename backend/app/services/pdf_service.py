"""
PDF ingestion service.

Changes vs original:
  - chunk_text() added (512-token windows, 64-token overlap via tiktoken)
  - embed_chunks() added (OpenAI text-embedding-3-small)
  - save_and_extract() now upserts embeddings after text extraction
  - delete_file() now also purges ChromaDB chunks
"""

import os
import uuid
from typing import List

import pdfplumber
from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

MAX_BYTES = settings.MAX_FILE_SIZE_MB * 1024 * 1024

# ── Lazy imports (so app boots even if openai not installed yet) ──────────────

def _tiktoken():
    import importlib
    tiktoken = importlib.import_module("tiktoken")
    return tiktoken.get_encoding("cl100k_base")


def _openai_client():
    import importlib
    openai = importlib.import_module("openai")
    return openai.OpenAI(api_key=settings.OPENAI_API_KEY)


# ── Chunking ──────────────────────────────────────────────────────────────────

CHUNK_TOKENS = 512
OVERLAP_TOKENS = 64


def chunk_text(text: str, size: int = CHUNK_TOKENS, overlap: int = OVERLAP_TOKENS) -> List[str]:
    """Split text into overlapping token windows, return list of strings."""
    if not text.strip():
        return []

    enc = _tiktoken()
    tokens = enc.encode(text)

    chunks: List[str] = []
    start = 0
    while start < len(tokens):
        end = min(start + size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunks.append(enc.decode(chunk_tokens))
        if end == len(tokens):
            break
        start += size - overlap

    return chunks


# ── Embedding ─────────────────────────────────────────────────────────────────

EMBED_MODEL = "text-embedding-3-small"
EMBED_BATCH = 100  # OpenAI max is 2048 inputs, keep batches sane


def embed_chunks(chunks: List[str]) -> List[List[float]]:
    """Return embeddings list matching chunks order."""
    if not chunks:
        return []

    client = _openai_client()
    embeddings: List[List[float]] = []

    for i in range(0, len(chunks), EMBED_BATCH):
        batch = chunks[i : i + EMBED_BATCH]
        response = client.embeddings.create(model=EMBED_MODEL, input=batch)
        embeddings.extend([item.embedding for item in response.data])

    return embeddings


# ── Main service ──────────────────────────────────────────────────────────────

def save_and_extract(file: UploadFile, user_id: int) -> dict:
    """Validate, save, extract text, chunk + embed asynchronously."""

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
        # doc_id not known yet — embedding happens in the endpoint after DB insert
        "_raw_text_for_embedding": extracted_text,
    }


def embed_and_store(user_id: int, doc_id: int, extracted_text: str) -> None:
    """
    Chunk + embed text and upsert into ChromaDB.
    Called AFTER the document row is committed (so doc_id is known).
    Silently skips if OPENAI_API_KEY not set or text empty.
    """
    from app.services.vector_store import upsert_chunks

    if not getattr(settings, "OPENAI_API_KEY", None):
        return
    if not extracted_text.strip():
        return

    try:
        chunks = chunk_text(extracted_text)
        if not chunks:
            return
        embeddings = embed_chunks(chunks)
        upsert_chunks(user_id, doc_id, chunks, embeddings)
    except Exception:
        # Non-fatal: document is saved; RAG just won't work for this doc
        pass


def delete_file(file_path: str) -> None:
    """Remove file from disk if it exists."""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except OSError:
        pass