from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentDetail, DocumentListResponse, DocumentOut
from app.services import pdf_service
from app.services.rag_service import answer_question
from app.services.vector_store import delete_document_chunks

router = APIRouter(prefix="/documents", tags=["documents"])


# ── Upload ────────────────────────────────────────────────────────────────────

@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = pdf_service.save_and_extract(file, current_user.id)

    # Pop internal key before passing to ORM
    raw_text = data.pop("_raw_text_for_embedding", "")

    doc = Document(user_id=current_user.id, **data)
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Embed + store asynchronously (non-fatal if fails)
    pdf_service.embed_and_store(current_user.id, doc.id, raw_text)

    return doc


# ── List ──────────────────────────────────────────────────────────────────────

@router.get("/", response_model=DocumentListResponse)
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    docs = (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .order_by(Document.uploaded_at.desc())
        .all()
    )
    return {"documents": docs, "total": len(docs)}


# ── Detail ────────────────────────────────────────────────────────────────────

@router.get("/{doc_id}", response_model=DocumentDetail)
def get_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return doc


# ── Delete ────────────────────────────────────────────────────────────────────

@router.delete("/{doc_id}", status_code=status.HTTP_200_OK)
def delete_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    pdf_service.delete_file(doc.file_path)
    delete_document_chunks(current_user.id, doc.id)  # purge embeddings
    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully."}


# ── Download ──────────────────────────────────────────────────────────────────

@router.get("/{doc_id}/download")
def download_document(
    doc_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return FileResponse(
        path=doc.file_path,
        media_type="application/pdf",
        filename=doc.original_name,
    )


# ── RAG: Ask ──────────────────────────────────────────────────────────────────

class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    chunks_used: int
    error: str | None = None


@router.post("/{doc_id}/ask", response_model=AskResponse)
def ask_document(
    doc_id: int,
    payload: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify ownership
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Question cannot be empty.",
        )

    result = answer_question(
        user_id=current_user.id,
        doc_id=doc_id,
        question=payload.question.strip(),
    )
    return result