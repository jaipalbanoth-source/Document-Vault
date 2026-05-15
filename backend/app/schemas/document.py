from datetime import datetime
from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: int
    filename: str
    original_name: str
    file_size: int
    page_count: int
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class DocumentDetail(DocumentOut):
    extracted_text: str | None


class DocumentListResponse(BaseModel):
    documents: list[DocumentOut]
    total: int
