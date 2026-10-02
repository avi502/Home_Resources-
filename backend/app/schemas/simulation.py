from typing import List, Optional
from pydantic import BaseModel, Field


class SimulationRequest(BaseModel):
    name: Optional[str] = Field("Custom Scenario", max_length=100)
    target_resource: str = Field(..., description="Resource to modify: 'water', 'electricity', 'food', etc.")
    change_percentage: float = Field(..., ge=-100.0, le=200.0, description="Percentage change (-15 means 15% reduction)")
    water_pump_model: bool = Field(True, description="Whether water changes propagate to well/booster pump electricity")
    pump_energy_intensity: Optional[float] = Field(0.0012, gt=0, description="kWh consumed per Liter pumped")
    tariff_override: Optional[float] = Field(None, gt=0, description="Optional custom tariff rate")


class UncertaintyInterval(BaseModel):
    minimum: float = Field(..., description="Conservative lower bound")
    expected: float = Field(..., description="Most probable expected outcome")
    maximum: float = Field(..., description="Optimistic upper bound")
    confidence_level: str = "80% confidence interval"


class SimulationResultResponse(BaseModel):
    scenario_name: str
    target_resource: str
    change_percentage: float
    unit: str
    
    baseline_usage: float
    simulated_usage: float
    usage_delta: float
    
    # Financial metrics
    currency: str
    baseline_cost: float
    simulated_cost: float
    cost_delta: float
    savings_uncertainty: UncertaintyInterval
    
    # Interconnected cascading impacts (e.g. water reduction saves pump electricity)
    cascading_impacts: List[dict]
    
    # Assumptions & explanation
    assumptions: List[str]
    methodology: str
