from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.db.session import engine, SessionLocal, Base
from backend.app.models.user import User
from backend.app.models.household import Household, HouseholdMember
from backend.app.models.resource_entry import ResourceEntry
from backend.app.core.security import get_password_hash
from backend.app.core.logging import logger


def init_database():
    """Initializes tables and seeds initial labeled synthetic demo data."""
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Check if demo user already exists
        existing_demo = db.query(User).filter(User.email == "demo@homeresource.local").first()
        if existing_demo:
            logger.info("Database already initialized with demo account.")
            return

        logger.info("Seeding initial labeled demo data for HomeResource...")

        # 1. Create Demo User
        demo_user = User(
            email="demo@homeresource.local",
            hashed_password=get_password_hash("Password123!"),
            full_name="Alex Rivera",
            is_active=True
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

        # 2. Create Demo Household
        demo_household = Household(
            name="Emerald Haven Eco-Home",
            owner_id=demo_user.id,
            currency="USD",
            timezone="America/Los_Angeles",
            electricity_tariff_rate=0.18, # $0.18 per kWh
            water_tariff_rate=0.004       # $0.004 per L ($4 per 1,000 L)
        )
        db.add(demo_household)
        db.commit()
        db.refresh(demo_household)

        # 3. Add Owner Membership
        membership = HouseholdMember(
            household_id=demo_household.id,
            user_id=demo_user.id,
            role="owner"
        )
        db.add(membership)
        db.commit()

        # 4. Generate 14 days of realistic household resource telemetry
        # Grounded in Section 6: baseline mean = 5.0 kWh, std_dev = ~0.8 kWh
        now = datetime.now(timezone.utc)
        demo_entries = []

        # Standard daily baseline readings (Day -13 to Day -1)
        # Normal baseline: ~5.0 kWh daily electricity, ~350 L water, ~1.5 hrs pump runtime
        daily_readings = [
            # (days_ago, elec_kwh, water_l, pump_hrs, food_kg, spent_usd)
            (13, 4.8, 320.0, 1.4, 2.1, 14.50),
            (12, 5.2, 360.0, 1.6, 1.8, 12.00),
            (11, 5.0, 340.0, 1.5, 2.4, 18.20),
            (10, 4.6, 310.0, 1.3, 1.5, 9.80),
            (9,  5.3, 380.0, 1.7, 2.8, 22.40),
            (8,  5.1, 350.0, 1.5, 2.0, 15.00),
            (7,  4.9, 330.0, 1.4, 1.9, 13.50),
            (6,  5.4, 370.0, 1.6, 2.2, 16.00),
            (5,  5.0, 340.0, 1.5, 1.7, 11.20),
            (4,  4.7, 315.0, 1.3, 2.5, 19.00),
            (3,  5.2, 365.0, 1.6, 2.1, 14.80),
            (2,  5.0, 345.0, 1.5, 1.8, 12.50),
            (1,  4.8, 335.0, 1.4, 2.3, 17.00),
            # Day 0 (Today): Elevated anomaly matching Section 6 (8.5 kWh electricity!)
            (0,  8.5, 540.0, 2.8, 3.8, 42.00),
        ]

        for days_ago, elec, water, pump, food, spent in daily_readings:
            recorded_time = now - timedelta(days=days_ago, hours=3)
            
            # Electricity entry
            demo_entries.append(ResourceEntry(
                household_id=demo_household.id,
                resource_type="electricity",
                amount=elec,
                unit="kWh",
                cost=round(elec * demo_household.electricity_tariff_rate, 2),
                activity_tag="hvac" if elec > 6.0 else "general",
                recorded_at=recorded_time,
                notes="[DEMO DATA] Daily aggregate meter telemetric log",
                is_demo=True
            ))

            # Water entry
            demo_entries.append(ResourceEntry(
                household_id=demo_household.id,
                resource_type="water",
                amount=water,
                unit="L",
                cost=round(water * demo_household.water_tariff_rate, 2),
                activity_tag="irrigation" if water > 400.0 else "domestic_plumbing",
                recorded_at=recorded_time,
                notes="[DEMO DATA] Smart flow sensor aggregate log",
                is_demo=True
            ))

            # Time entry (pump runtime)
            demo_entries.append(ResourceEntry(
                household_id=demo_household.id,
                resource_type="time",
                amount=pump,
                unit="hrs",
                cost=0.0,
                activity_tag="water_pump",
                recorded_at=recorded_time,
                notes="[DEMO DATA] Pressure booster pump active motor runtime",
                is_demo=True
            ))

            # Food entry
            demo_entries.append(ResourceEntry(
                household_id=demo_household.id,
                resource_type="food",
                amount=food,
                unit="kg",
                cost=round(spent * 0.45, 2),
                activity_tag="cooking",
                recorded_at=recorded_time,
                notes="[DEMO DATA] Kitchen food consumption tracking",
                is_demo=True
            ))

            # Money / financial entry
            demo_entries.append(ResourceEntry(
                household_id=demo_household.id,
                resource_type="money",
                amount=spent,
                unit="USD",
                cost=spent,
                activity_tag="general",
                recorded_at=recorded_time,
                notes="[DEMO DATA] Daily resource-related household expenditures",
                is_demo=True
            ))

        db.add_all(demo_entries)
        db.commit()
        logger.info(f"Successfully seeded {len(demo_entries)} demo telemetry entries for household '{demo_household.name}'.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_database()
