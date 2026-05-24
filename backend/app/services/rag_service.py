"""
RAG query service.

Flow:
  question → embed → ChromaDB top-k → build prompt → OpenAI chat → answer
"""

from app.core.config import settings
from app.services.pdf_service import EMBED_MODEL, _openai_client
from app.services.vector_store import query_chunks

CHAT_MODEL = "gpt-4o-mini"

SYSTEM_PROMPT = """\
You are a precise document assistant. Answer the user's question using ONLY
the provided document excerpts. If the excerpts don't contain enough
information, say so clearly — do not invent facts.

Format rules:
- Be concise and direct.
- If quoting, use short inline quotes only.
- Use plain text; no markdown headers.
"""


def _embed_query(question: str) -> list[float]:
    client = _openai_client()
    response = client.embeddings.create(model=EMBED_MODEL, input=[question])
    return response.data[0].embedding


def _build_user_prompt(question: str, chunks: list[str]) -> str:
    excerpt_block = "\n\n---\n\n".join(
        f"[Excerpt {i + 1}]\n{chunk}" for i, chunk in enumerate(chunks)
    )
    return (
        f"Document excerpts:\n\n{excerpt_block}\n\n"
        f"Question: {question}"
    )


def answer_question(
    user_id: int,
    doc_id: int,
    question: str,
    top_k: int = 5,
) -> dict:
    """
    Returns {"answer": str, "chunks_used": int, "error": str|None}
    """
    if not getattr(settings, "OPENAI_API_KEY", None):
        return {
            "answer": "",
            "chunks_used": 0,
            "error": "OPENAI_API_KEY not configured on server.",
        }

    try:
        query_embedding = _embed_query(question)
    except Exception as e:
        return {"answer": "", "chunks_used": 0, "error": f"Embedding failed: {e}"}

    chunks = query_chunks(user_id, doc_id, query_embedding, top_k=top_k)

    if not chunks:
        return {
            "answer": (
                "No indexed content found for this document. "
                "This may happen if the document has no extractable text, "
                "or indexing failed during upload."
            ),
            "chunks_used": 0,
            "error": None,
        }

    prompt = _build_user_prompt(question, chunks)

    try:
        client = _openai_client()
        response = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=1024,
        )
        answer = response.choices[0].message.content or ""
    except Exception as e:
        return {"answer": "", "chunks_used": len(chunks), "error": f"LLM call failed: {e}"}

    return {
        "answer": answer,
        "chunks_used": len(chunks),
        "error": None,
    }