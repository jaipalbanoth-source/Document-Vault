from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import engine
from app.db import all_models  # noqa: F401 — ensure models are registered
from app.db.base import Base

# Create tables if not exist (use Alembic for production migrations)
Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="DocumentVault API",
    description="Secure document management — upload, extract, manage PDFs.",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}


app.include_router(api_router, prefix="/api/v1")
