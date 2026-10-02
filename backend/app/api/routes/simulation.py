from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.api.deps import get_current_user
from backend.app.models.user import User
from backend.app.repositories.household_repo import HouseholdRepository
from backend.app.repositories.resource_repo import ResourceRepository
from backend.app.schemas.simulation import SimulationRequest, SimulationResultResponse
from backend.app.schemas.common import StandardResponse
from backend.app.simulation.engine import run_simulation
from backend.app.simulation.scenarios import PRESET_SCENARIOS

router = APIRouter(prefix="/simulation", tags=["What-If Simulation Engine"])


@router.get("/presets", response_model=StandardResponse[List[Dict[str, Any]]])
def get_presets():
    """Returns preset curated simulation scenarios."""
    return StandardResponse(data=PRESET_SCENARIOS)


@router.post("/{household_id}/simulate", response_model=StandardResponse[SimulationResultResponse])
def execute_simulation(
    household_id: int,
    req: SimulationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Runs a multi-resource interconnected simulation with sensitivity uncertainty bounds."""
    h_repo = HouseholdRepository(db)
    if not h_repo.user_has_access(current_user.id, household_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to run simulations for this household"
        )
    
    household = h_repo.get_by_id(household_id)
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    res_repo = ResourceRepository(db)
    entries = res_repo.get_entries(household_id, limit=500)

    result = run_simulation(household, entries, req)
    return StandardResponse(data=result)
