from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.db.session import get_db
from backend.app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from backend.app.schemas.common import StandardResponse
from backend.app.services.auth_service import AuthService
from backend.app.api.deps import get_current_user
from backend.app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=StandardResponse[UserResponse], status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Registers a new user and provisions default household."""
    service = AuthService(db)
    user = service.register(user_in)
    return StandardResponse(data=UserResponse.model_validate(user))


@router.post("/login", response_model=StandardResponse[Token])
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticates user and returns JWT bearer token."""
    service = AuthService(db)
    token = service.authenticate(login_in)
    return StandardResponse(data=token)


@router.get("/me", response_model=StandardResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user profile."""
    return StandardResponse(data=UserResponse.model_validate(current_user))
