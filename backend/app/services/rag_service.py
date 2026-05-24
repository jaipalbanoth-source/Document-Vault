import re
import numpy as np
from groq import Groq
from sentence_transformers import SentenceTransformer
from app.core.config import settings

# Load model once at module level (cached after first load)
_embedder: SentenceTransformer | None = None


def _get_embedder() -> SentenceTransformer:
    global _embedder
    if _embedder is None:
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def _chunk_text(text: str, chunk_size: int, overlap: int) -> list[str]:
    """Split text into overlapping word-based chunks."""
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + chunk_size
        chunk = " ".join(words[start:end])
        chunk = chunk.strip()
        if chunk:
            chunks.append(chunk)
        start += chunk_size - overlap
    return chunks


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-10))


def answer_question(extracted_text: str, question: str) -> dict:
    """
    Full RAG pipeline:
    1. Chunk the document text
    2. Embed chunks + question
    3. Retrieve top-k relevant chunks
    4. Send to Groq LLM for answer
    """
    if not settings.GROQ_API_KEY:
        return {
            "answer": "",
            "chunks_used": 0,
            "error": "GROQ_API_KEY is not configured on the server.",
        }

    if not extracted_text or not extracted_text.strip():
        return {
            "answer": "",
            "chunks_used": 0,
            "error": "This document has no extracted text to query against.",
        }

    # ── 1. Chunk ────────────────────────────────────────────────────────────
    chunks = _chunk_text(
        extracted_text,
        chunk_size=settings.CHUNK_SIZE,
        overlap=settings.CHUNK_OVERLAP,
    )
    if not chunks:
        return {"answer": "", "chunks_used": 0, "error": "Document text could not be chunked."}

    # ── 2. Embed ─────────────────────────────────────────────────────────────
    embedder = _get_embedder()
    chunk_embeddings = embedder.encode(chunks, convert_to_numpy=True)
    question_embedding = embedder.encode([question], convert_to_numpy=True)[0]

    # ── 3. Retrieve top-k chunks ─────────────────────────────────────────────
    similarities = [
        _cosine_similarity(question_embedding, ce) for ce in chunk_embeddings
    ]
    top_k = min(settings.TOP_K_CHUNKS, len(chunks))
    top_indices = sorted(range(len(similarities)), key=lambda i: similarities[i], reverse=True)[:top_k]
    top_chunks = [chunks[i] for i in sorted(top_indices)]  # preserve order
    context = "\n\n---\n\n".join(top_chunks)

    # ── 4. Generate answer via Groq ──────────────────────────────────────────
    client = Groq(api_key=settings.GROQ_API_KEY)
    system_prompt = (
        "You are a helpful assistant that answers questions strictly based on "
        "the provided document context. If the answer is not in the context, "
        "say so clearly. Be concise and accurate."
    )
    user_prompt = f"Context from document:\n\n{context}\n\n---\n\nQuestion: {question}"

    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=1024,
            temperature=0.2,
        )
        answer = response.choices[0].message.content or ""
        return {"answer": answer, "chunks_used": top_k, "error": None}
    except Exception as e:
        return {"answer": "", "chunks_used": 0, "error": f"LLM error: {str(e)}"}