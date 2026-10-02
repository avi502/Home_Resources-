# Import all the models, so that Base has them before being
# imported by Alembic or the app setup
from backend.app.db.session import Base
from backend.app.models.user import User
from backend.app.models.household import Household, HouseholdMember
from backend.app.models.resource_entry import ResourceEntry
from backend.app.models.scenario import SimulationScenario
