from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered.",
        )
    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login")
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account disabled.")

    token = create_access_token({"sub": str(user.id)})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,        # Set True in production (HTTPS)
        samesite="lax",
        max_age=1800,
        path="/",
    )
    return {
        "message": "Login successful",
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name},
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
