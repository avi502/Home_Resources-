from typing import Optional, List, Dict
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.models.resource_entry import ResourceEntry
from backend.app.schemas.resource import ResourceEntryCreate, ResourceEntryUpdate


# Unit normalization map: converts alternate units to canonical unit
CANONICAL_UNITS = {
    "Wh": ("kWh", 0.001),
    "kWh": ("kWh", 1.0),
    "gal": ("L", 3.78541),
    "m3": ("L", 1000.0),
    "L": ("L", 1.0),
    "g": ("kg", 0.001),
    "kg": ("kg", 1.0),
    "mins": ("hrs", 1.0 / 60.0),
    "hrs": ("hrs", 1.0),
}


class ResourceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, entry_id: int) -> Optional[ResourceEntry]:
        return self.db.query(ResourceEntry).filter(ResourceEntry.id == entry_id).first()

    def get_entries(
        self,
        household_id: int,
        resource_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[ResourceEntry]:
        q = self.db.query(ResourceEntry).filter(ResourceEntry.household_id == household_id)
        if resource_type:
            q = q.filter(ResourceEntry.resource_type == resource_type)
        return q.order_by(ResourceEntry.recorded_at.desc()).offset(offset).limit(limit).all()

    def create(self, household_id: int, obj_in: ResourceEntryCreate) -> ResourceEntry:
        # Standardize units explicitly (e.g. Wh to kWh, gal to L)
        amount = obj_in.amount
        unit = obj_in.unit
        if unit in CANONICAL_UNITS:
            canonical_unit, factor = CANONICAL_UNITS[unit]
            amount = amount * factor
            unit = canonical_unit

        entry = ResourceEntry(
            household_id=household_id,
            resource_type=obj_in.resource_type,
            amount=round(amount, 4),
            unit=unit,
            cost=obj_in.cost or 0.0,
            activity_tag=obj_in.activity_tag or "general",
            recorded_at=obj_in.recorded_at or datetime.now(timezone.utc),
            notes=obj_in.notes,
            is_demo=obj_in.is_demo
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def update(self, entry: ResourceEntry, obj_in: ResourceEntryUpdate) -> ResourceEntry:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(entry, field, value)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    def delete(self, entry: ResourceEntry) -> None:
        self.db.delete(entry)
        self.db.commit()

    def delete_all_for_household(self, household_id: int) -> int:
        count = self.db.query(ResourceEntry).filter(ResourceEntry.household_id == household_id).delete()
        self.db.commit()
        return count
