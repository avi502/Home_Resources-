from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.core.security import decode_access_token
from backend.app.core.config import settings
from backend.app.repositories.user_repo import UserRepository
from backend.app.models.user import User

security_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    db: Session = Depends(get_db),
    cred: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme)
) -> User:
    is_demo_mode = settings.DEMO_MODE and settings.ENVIRONMENT != "test"
    token = cred.credentials if cred else None

    # Support instant local demo session or missing credentials in demo mode
    if not token or token in ("demo-token", "null", "undefined", ""):
        if is_demo_mode:
            demo_user = db.query(User).filter(User.email == "demo@homeresource.local").first()
            if demo_user:
                return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        if is_demo_mode:
            demo_user = db.query(User).filter(User.email == "demo@homeresource.local").first()
            if demo_user:
                return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = int(payload["sub"])
    except (ValueError, TypeError):
        if is_demo_mode:
            demo_user = db.query(User).filter(User.email == "demo@homeresource.local").first()
            if demo_user:
                return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed token subject",
        )

    user = UserRepository(db).get_by_id(user_id)
    if not user:
        if is_demo_mode:
            demo_user = db.query(User).filter(User.email == "demo@homeresource.local").first()
            if demo_user:
                return demo_user
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account",
        )

    return user
