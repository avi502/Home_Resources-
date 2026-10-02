from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class BaselineResponse(BaseModel):
    resource_type: str
    mean: float
    std_dev: float
    median: float
    min_value: float
    max_value: float
    unit: str
    sample_count: int
    is_reliable: bool = Field(..., description="True if sample size >= 7 observations")


class AnomalyResponse(BaseModel):
    entry_id: int
    resource_type: str
    recorded_at: datetime
    value: float
    unit: str
    baseline_mean: float
    baseline_std: float
    z_score: float = Field(..., description="Standardized deviation: z = (x - mean) / std")
    severity: str = Field(..., description="'moderate' (2-3 std) or 'severe' (>3 std)")
    explanation: str
    is_anomaly: bool = True


class RelationshipNode(BaseModel):
    id: str
    label: str
    resource_type: str
    current_value: float
    unit: str
    color: str


class RelationshipEdge(BaseModel):
    source: str
    target: str
    relationship_type: str
    correlation_coefficient: Optional[float] = None
    observation_count: int
    description: str
    is_causal: bool = Field(False, description="Safeguard flag: Distinguish correlation from proven causation")


class RelationshipGraphResponse(BaseModel):
    nodes: List[RelationshipNode]
    edges: List[RelationshipEdge]
    correlation_safeguard_note: str = (
        "Statistical correlation does not imply causation. Associations between resource usage "
        "patterns (e.g. pump runtime and electricity) require physical system validation."
    )
