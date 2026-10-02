from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.repositories.user_repo import UserRepository
from backend.app.repositories.household_repo import HouseholdRepository
from backend.app.schemas.auth import UserRegister, UserLogin, Token
from backend.app.schemas.household import HouseholdCreate
from backend.app.core.security import get_password_hash, verify_password, create_access_token
from backend.app.models.user import User


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)
        self.household_repo = HouseholdRepository(db)

    def register(self, obj_in: UserRegister) -> User:
        existing = self.user_repo.get_by_email(obj_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists"
            )
        hashed_password = get_password_hash(obj_in.password)
        user = self.user_repo.create(
            email=obj_in.email,
            hashed_password=hashed_password,
            full_name=obj_in.full_name
        )

        # Automatically create default household for new user
        household_name = f"{obj_in.full_name or 'My'} Sustainable Home"
        self.household_repo.create(
            user_id=user.id,
            obj_in=HouseholdCreate(name=household_name, currency="USD", timezone="UTC")
        )
        return user

    def authenticate(self, obj_in: UserLogin) -> Token:
        user = self.user_repo.get_by_email(obj_in.email)
        if not user or not verify_password(obj_in.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive"
            )

        token = create_access_token(subject=user.id)
        # Find default household
        households = self.household_repo.get_for_user(user.id)
        default_household_id = households[0].id if households else None

        return Token(
            access_token=token,
            token_type="bearer",
            user_id=user.id,
            email=user.email,
            household_id=default_household_id
        )
