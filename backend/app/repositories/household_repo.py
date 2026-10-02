from typing import Optional, List
from sqlalchemy.orm import Session
from backend.app.models.household import Household, HouseholdMember
from backend.app.schemas.household import HouseholdCreate, HouseholdUpdate


class HouseholdRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, household_id: int) -> Optional[Household]:
        return self.db.query(Household).filter(Household.id == household_id).first()

    def get_for_user(self, user_id: int) -> List[Household]:
        # Return households where user is owner or member
        owned = self.db.query(Household).filter(Household.owner_id == user_id).all()
        member_households = (
            self.db.query(Household)
            .join(HouseholdMember, Household.id == HouseholdMember.household_id)
            .filter(HouseholdMember.user_id == user_id)
            .all()
        )
        # Deduplicate
        all_h = {h.id: h for h in (owned + member_households)}
        return list(all_h.values())

    def user_has_access(self, user_id: int, household_id: int) -> bool:
        """Strict server-side check ensuring user owns or belongs to household."""
        household = self.get_by_id(household_id)
        if not household:
            return False
        if household.owner_id == user_id:
            return True
        membership = self.db.query(HouseholdMember).filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == user_id
        ).first()
        return membership is not None

    def create(self, user_id: int, obj_in: HouseholdCreate) -> Household:
        household = Household(
            name=obj_in.name,
            owner_id=user_id,
            currency=obj_in.currency,
            timezone=obj_in.timezone,
            electricity_tariff_rate=obj_in.electricity_tariff_rate,
            water_tariff_rate=obj_in.water_tariff_rate
        )
        self.db.add(household)
        self.db.commit()
        self.db.refresh(household)

        # Add owner membership
        member = HouseholdMember(
            household_id=household.id,
            user_id=user_id,
            role="owner"
        )
        self.db.add(member)
        self.db.commit()
        return household

    def update(self, household: Household, obj_in: HouseholdUpdate) -> Household:
        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(household, field, value)
        self.db.commit()
        self.db.refresh(household)
        return household
