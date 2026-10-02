from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import TimestampMixin


class Household(Base, TimestampMixin):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    timezone = Column(String(50), default="UTC", nullable=False)
    electricity_tariff_rate = Column(Float, default=0.18, nullable=False) # $ per kWh
    water_tariff_rate = Column(Float, default=0.004, nullable=False)       # $ per Liter

    # Relationships
    owner = relationship("User", back_populates="owned_households")
    members = relationship("HouseholdMember", back_populates="household", cascade="all, delete-orphan")
    resource_entries = relationship("ResourceEntry", back_populates="household", cascade="all, delete-orphan")
    scenarios = relationship("SimulationScenario", back_populates="household", cascade="all, delete-orphan")


class HouseholdMember(Base, TimestampMixin):
    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(50), default="member", nullable=False)  # 'owner', 'admin', 'member'

    # Relationships
    household = relationship("Household", back_populates="members")
    user = relationship("User", back_populates="memberships")
