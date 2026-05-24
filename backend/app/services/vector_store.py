"""
ChromaDB wrapper. One collection per user, metadata-filtered by doc_id.
Chunk IDs: "{user_id}_{doc_id}_{chunk_idx}"
"""

import os
from typing import List

import chromadb
from chromadb.config import Settings

from app.core.config import settings as app_settings

# Persist to UPLOAD_DIR/../chroma  (sits next to uploads/)
_CHROMA_PATH = os.path.join(
    os.path.dirname(app_settings.UPLOAD_DIR), "chroma"
)

_client: chromadb.PersistentClient | None = None


def _get_client() -> chromadb.PersistentClient:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=_CHROMA_PATH,
            settings=Settings(anonymized_telemetry=False),
        )
    return _client


def _collection_name(user_id: int) -> str:
    return f"user_{user_id}"


def _get_collection(user_id: int):
    return _get_client().get_or_create_collection(
        name=_collection_name(user_id),
        metadata={"hnsw:space": "cosine"},
    )


# ── Upsert ────────────────────────────────────────────────────────────────────

def upsert_chunks(
    user_id: int,
    doc_id: int,
    chunks: List[str],
    embeddings: List[List[float]],
) -> None:
    """Store chunks + embeddings for one document."""
    if not chunks:
        return

    col = _get_collection(user_id)
    ids = [f"{user_id}_{doc_id}_{i}" for i in range(len(chunks))]
    metadatas = [{"doc_id": doc_id, "chunk_idx": i} for i in range(len(chunks))]

    col.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=chunks,
        metadatas=metadatas,
    )


# ── Query ─────────────────────────────────────────────────────────────────────

def query_chunks(
    user_id: int,
    doc_id: int,
    query_embedding: List[float],
    top_k: int = 5,
) -> List[str]:
    """Return top-k chunk texts for a given doc, closest to query."""
    col = _get_collection(user_id)

    results = col.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"doc_id": doc_id},
        include=["documents"],
    )
    docs = results.get("documents", [[]])[0]
    return docs  # list[str]


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_document_chunks(user_id: int, doc_id: int) -> None:
    """Remove all chunks for a document (call on document delete)."""
    try:
        col = _get_collection(user_id)
        col.delete(where={"doc_id": doc_id})
    except Exception:
        pass  # non-fatal: embeddings already gone if collection missing