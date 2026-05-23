# Import all models here so Alembic can detect them
from app.db.base import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.document import Document  # noqa: F401
