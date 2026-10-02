from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User
from backend.app.repositories.household_repo import HouseholdRepository
from backend.app.schemas.household import HouseholdCreate, HouseholdUpdate, HouseholdResponse
from backend.app.schemas.common import StandardResponse

router = APIRouter(prefix="/households", tags=["Households"])


@router.get("", response_model=StandardResponse[List[HouseholdResponse]])
def list_households(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = HouseholdRepository(db)
    households = repo.get_for_user(current_user.id)
    return StandardResponse(data=[HouseholdResponse.model_validate(h) for h in households])


@router.post("", response_model=StandardResponse[HouseholdResponse], status_code=status.HTTP_201_CREATED)
def create_household(
    household_in: HouseholdCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = HouseholdRepository(db)
    household = repo.create(current_user.id, household_in)
    return StandardResponse(data=HouseholdResponse.model_validate(household))


@router.get("/{household_id}", response_model=StandardResponse[HouseholdResponse])
def get_household(
    household_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = HouseholdRepository(db)
    if not repo.user_has_access(current_user.id, household_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    household = repo.get_by_id(household_id)
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")
    return StandardResponse(data=HouseholdResponse.model_validate(household))


@router.put("/{household_id}", response_model=StandardResponse[HouseholdResponse])
def update_household(
    household_id: int,
    household_in: HouseholdUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = HouseholdRepository(db)
    if not repo.user_has_access(current_user.id, household_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    household = repo.get_by_id(household_id)
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")
    updated = repo.update(household, household_in)
    return StandardResponse(data=HouseholdResponse.model_validate(updated))
