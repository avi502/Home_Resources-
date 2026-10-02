from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User
from backend.app.services.resource_service import ResourceService
from backend.app.schemas.resource import (
    ResourceEntryCreate,
    ResourceEntryResponse,
    DashboardSummaryResponse
)
from backend.app.schemas.common import StandardResponse

router = APIRouter(prefix="/resources", tags=["Resource Entries"])


@router.get("/{household_id}/entries", response_model=StandardResponse[List[ResourceEntryResponse]])
def list_entries(
    household_id: int,
    resource_type: Optional[str] = Query(None, description="electricity, water, food, money, time"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ResourceService(db)
    entries = service.get_entries(current_user.id, household_id, resource_type, limit, offset)
    return StandardResponse(data=[ResourceEntryResponse.model_validate(e) for e in entries])


@router.post("/{household_id}/entries", response_model=StandardResponse[ResourceEntryResponse], status_code=status.HTTP_201_CREATED)
def add_entry(
    household_id: int,
    entry_in: ResourceEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ResourceService(db)
    entry = service.add_entry(current_user.id, household_id, entry_in)
    return StandardResponse(data=ResourceEntryResponse.model_validate(entry))


@router.delete("/{household_id}/entries/{entry_id}", response_model=StandardResponse[dict])
def delete_entry(
    household_id: int,
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ResourceService(db)
    service.delete_entry(current_user.id, household_id, entry_id)
    return StandardResponse(data={"message": "Resource entry deleted successfully"})


@router.get("/{household_id}/dashboard", response_model=StandardResponse[DashboardSummaryResponse])
def get_dashboard(
    household_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ResourceService(db)
    summary = service.get_dashboard_summary(current_user.id, household_id)
    return StandardResponse(data=summary)
