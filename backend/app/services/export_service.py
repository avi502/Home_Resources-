from typing import List, Dict, Any
import csv
import io
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.repositories.resource_repo import ResourceRepository
from backend.app.repositories.household_repo import HouseholdRepository


class ExportService:
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

    def export_json(self, user_id: int, household_id: int) -> Dict[str, Any]:
        self._ensure_household_access(user_id, household_id)
        household = self.h_repo.get_by_id(household_id)
        entries = self.res_repo.get_entries(household_id, limit=5000)

        return {
            "household": {
                "id": household.id,
                "name": household.name,
                "currency": household.currency,
                "timezone": household.timezone,
                "electricity_tariff_rate": household.electricity_tariff_rate,
                "water_tariff_rate": household.water_tariff_rate,
            },
            "exported_at_utc": str(household.updated_at),
            "total_records": len(entries),
            "records": [
                {
                    "id": e.id,
                    "resource_type": e.resource_type,
                    "amount": e.amount,
                    "unit": e.unit,
                    "cost": e.cost,
                    "activity_tag": e.activity_tag,
                    "recorded_at": e.recorded_at.isoformat(),
                    "notes": e.notes,
                    "is_demo": e.is_demo
                }
                for e in entries
            ]
        }

    def export_csv(self, user_id: int, household_id: int) -> str:
        self._ensure_household_access(user_id, household_id)
        entries = self.res_repo.get_entries(household_id, limit=10000)

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["ID", "Timestamp (UTC)", "Resource", "Amount", "Unit", "Cost", "Activity", "Notes", "Is Demo"])

        for e in entries:
            writer.writerow([
                e.id,
                e.recorded_at.isoformat(),
                e.resource_type,
                e.amount,
                e.unit,
                e.cost,
                e.activity_tag,
                e.notes or "",
                e.is_demo
            ])

        return output.getvalue()

    def wipe_household_data(self, user_id: int, household_id: int) -> int:
        """Deletes all telemetry and resource records for a household (GDPR Right to be Forgotten)."""
        self._ensure_household_access(user_id, household_id)
        return self.res_repo.delete_all_for_household(household_id)
