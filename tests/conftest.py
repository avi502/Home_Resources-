import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.main import app
from backend.app.db.session import Base, get_db
from backend.app.core.security import create_access_token, get_password_hash
from backend.app.models.user import User
from backend.app.models.household import Household, HouseholdMember
from backend.app.models.resource_entry import ResourceEntry

TEST_DB_URL = "sqlite:///./test.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test.db"):
        try:
            os.remove("./test.db")
        except Exception:
            pass


@pytest.fixture
def db():
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    user = User(
        email="testowner@homeresource.local",
        hashed_password=get_password_hash("SecretPass123!"),
        full_name="Primary Owner",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    household = Household(
        name="Primary Residence",
        owner_id=user.id,
        currency="USD",
        timezone="UTC",
        electricity_tariff_rate=0.18,
        water_tariff_rate=0.004
    )
    db.add(household)
    db.commit()
    db.refresh(household)

    member = HouseholdMember(household_id=household.id, user_id=user.id, role="owner")
    db.add(member)
    db.commit()

    token = create_access_token(user.id)
    return {"user": user, "household": household, "token": token}


@pytest.fixture
def second_user(db):
    user = User(
        email="stranger@homeresource.local",
        hashed_password=get_password_hash("SecretPass123!"),
        full_name="Second User",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    household = Household(
        name="Stranger Household",
        owner_id=user.id,
        currency="USD",
        timezone="UTC",
        electricity_tariff_rate=0.20,
        water_tariff_rate=0.005
    )
    db.add(household)
    db.commit()
    db.refresh(household)

    member = HouseholdMember(household_id=household.id, user_id=user.id, role="owner")
    db.add(member)
    db.commit()

    token = create_access_token(user.id)
    return {"user": user, "household": household, "token": token}
