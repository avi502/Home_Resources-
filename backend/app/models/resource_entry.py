from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Index
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import TimestampMixin


class ResourceEntry(Base, TimestampMixin):
    __tablename__ = "resource_entries"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    
    # Resource type: 'electricity', 'water', 'food', 'money', 'time'
    resource_type = Column(String(50), nullable=False, index=True)
    
    # Amount and explicit unit (e.g. kWh, L, kg, USD, hrs)
    amount = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    
    # Financial cost in household currency
    cost = Column(Float, default=0.0, nullable=False)
    
    # Associated activity/system (e.g., 'water_pump', 'hvac', 'laundry', 'cooking', 'ev_charging')
    activity_tag = Column(String(100), default="general", nullable=False, index=True)
    
    # Timestamp of the observation/usage in UTC
    recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    
    # Context notes & demo flag
    notes = Column(String(500), nullable=True)
    is_demo = Column(Boolean, default=False, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="resource_entries")

    __table_args__ = (
        Index("idx_household_res_time", "household_id", "resource_type", "recorded_at"),
    )
