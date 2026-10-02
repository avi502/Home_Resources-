from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User
from backend.app.repositories.household_repo import HouseholdRepository
from backend.app.repositories.resource_repo import ResourceRepository
from backend.app.intelligence.baseline import calculate_baseline
from backend.app.intelligence.anomaly import detect_anomalies
from backend.app.intelligence.relationships import build_relationship_graph
from backend.app.schemas.intelligence import (
    BaselineResponse,
    AnomalyResponse,
    RelationshipGraphResponse
)
from backend.app.schemas.common import StandardResponse

router = APIRouter(prefix="/intelligence", tags=["Intelligence Engine"])


def _verify_access(db: Session, user_id: int, household_id: int):
    h_repo = HouseholdRepository(db)
    if not h_repo.user_has_access(user_id, household_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this household's intelligence telemetry"
        )


@router.get("/{household_id}/baseline/{resource_type}", response_model=StandardResponse[BaselineResponse])
def get_resource_baseline(
    household_id: int,
    resource_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Calculates statistical baseline (mean, std dev, median, reliability) for a resource."""
    _verify_access(db, current_user.id, household_id)
    res_repo = ResourceRepository(db)
    entries = res_repo.get_entries(household_id, limit=500)
    baseline = calculate_baseline(entries, resource_type.lower())
    return StandardResponse(data=baseline)


@router.get("/{household_id}/anomalies/{resource_type}", response_model=StandardResponse[List[AnomalyResponse]])
def get_resource_anomalies(
    household_id: int,
    resource_type: str,
    threshold: float = Query(2.0, ge=1.0, le=5.0, description="Standardized z-score cutoff threshold"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Detects statistical deviations exceeding the z-score threshold (z = (x - mean)/std)."""
    _verify_access(db, current_user.id, household_id)
    res_repo = ResourceRepository(db)
    entries = res_repo.get_entries(household_id, limit=500)
    anomalies = detect_anomalies(entries, resource_type.lower(), z_threshold=threshold)
    return StandardResponse(data=anomalies)


@router.get("/{household_id}/relationships", response_model=StandardResponse[RelationshipGraphResponse])
def get_resource_relationships(
    household_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generates the interconnected resource relationship graph with causation safeguards."""
    _verify_access(db, current_user.id, household_id)
    res_repo = ResourceRepository(db)
    entries = res_repo.get_entries(household_id, limit=500)
    graph = build_relationship_graph(entries)
    return StandardResponse(data=graph)
