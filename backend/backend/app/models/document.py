from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)          # stored UUID name
    original_name = Column(String(255), nullable=False)     # original upload name
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False)          # bytes
    page_count = Column(Integer, default=0)
    extracted_text = Column(Text(length=4294967295), nullable=True)  # LONGTEXT
    mime_type = Column(String(50), default="application/pdf")
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="documents")
