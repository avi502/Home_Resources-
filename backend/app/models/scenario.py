from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship
from backend.app.db.session import Base
from backend.app.models.base import TimestampMixin


class SimulationScenario(Base, TimestampMixin):
    __tablename__ = "simulation_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)
    target_resource = Column(String(50), nullable=False)
    change_percentage = Column(Float, nullable=False) # e.g. -15.0 for 15% reduction
    
    # Computed metrics
    baseline_value = Column(Float, nullable=False)
    simulated_value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)
    
    # Financial impact & uncertainty
    estimated_savings_min = Column(Float, default=0.0, nullable=False)
    estimated_savings_expected = Column(Float, default=0.0, nullable=False)
    estimated_savings_max = Column(Float, default=0.0, nullable=False)
    
    # Assumptions stored as structured JSON list
    assumptions = Column(JSON, default=list, nullable=False)
    
    # Relationships
    household = relationship("Household", back_populates="scenarios")
