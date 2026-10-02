from typing import List, Optional, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from collections import defaultdict

from backend.app.repositories.resource_repo import ResourceRepository
from backend.app.repositories.household_repo import HouseholdRepository
from backend.app.schemas.resource import (
    ResourceEntryCreate,
    ResourceEntryUpdate,
    ResourceEntryResponse,
    ResourceSummaryItem,
    DashboardSummaryResponse
)
from backend.app.models.resource_entry import ResourceEntry


class ResourceService:
    def __init__(self, db: Session):
        self.db = db
        self.res_repo = ResourceRepository(db)
        self.h_repo = HouseholdRepository(db)

    def _ensure_household_access(self, user_id: int, household_id: int):
        if not self.h_repo.user_has_access(user_id, household_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permissions for this household"
            )

    def add_entry(self, user_id: int, household_id: int, obj_in: ResourceEntryCreate) -> ResourceEntry:
        self._ensure_household_access(user_id, household_id)
        return self.res_repo.create(household_id, obj_in)

    def get_entries(
        self,
        user_id: int,
        household_id: int,
        resource_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[ResourceEntry]:
        self._ensure_household_access(user_id, household_id)
        return self.res_repo.get_entries(household_id, resource_type, limit, offset)

    def delete_entry(self, user_id: int, household_id: int, entry_id: int):
        self._ensure_household_access(user_id, household_id)
        entry = self.res_repo.get_by_id(entry_id)
        if not entry or entry.household_id != household_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Resource entry not found"
            )
        self.res_repo.delete(entry)

    def get_dashboard_summary(self, user_id: int, household_id: int) -> DashboardSummaryResponse:
        self._ensure_household_access(user_id, household_id)
        household = self.h_repo.get_by_id(household_id)
        entries = self.res_repo.get_entries(household_id, limit=500)

        # Aggregate metrics by resource type
        type_totals = defaultdict(float)
        type_costs = defaultdict(float)
        type_counts = defaultdict(int)
        type_units = {}
        has_demo = False

        for e in entries:
            type_totals[e.resource_type] += e.amount
            type_costs[e.resource_type] += e.cost
            type_counts[e.resource_type] += 1
            type_units[e.resource_type] = e.unit
            if e.is_demo:
                has_demo = True

        summaries: List[ResourceSummaryItem] = []
        for r_type in ["electricity", "water", "food", "money", "time"]:
            cnt = type_counts[r_type]
            tot = type_totals[r_type]
            cst = type_costs[r_type]
            unit = type_units.get(r_type, "kWh" if r_type == "electricity" else ("L" if r_type == "water" else "units"))
            
            # Simple daily avg proxy based on recorded count
            daily_avg = (tot / max(1, cnt / 3)) if cnt > 0 else 0.0

            summaries.append(ResourceSummaryItem(
                resource_type=r_type,
                total_amount=round(tot, 2),
                unit=unit,
                total_cost=round(cst, 2),
                entry_count=cnt,
                daily_average=round(daily_avg, 2),
                is_demo=has_demo
            ))

        recent = entries[:15]
        return DashboardSummaryResponse(
            summaries=summaries,
            recent_entries=[ResourceEntryResponse.model_validate(r) for r in recent],
            household_name=household.name,
            currency=household.currency
        )
