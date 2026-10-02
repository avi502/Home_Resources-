from typing import List, Optional
from backend.app.models.resource_entry import ResourceEntry
from backend.app.intelligence.baseline import calculate_baseline
from backend.app.schemas.intelligence import AnomalyResponse


def detect_anomalies(
    entries: List[ResourceEntry],
    resource_type: str,
    z_threshold: float = 2.0
) -> List[AnomalyResponse]:
    """Detects statistical deviations using standardized z-scores: z = (x - mean) / std.

    Grounded directly in Section 6 of the HomeResource blueprint.
    """
    baseline = calculate_baseline(entries, resource_type)
    
    if not baseline.is_reliable or baseline.std_dev == 0.0:
        # Cannot reliably detect anomalies without sufficient variance or samples
        return []

    anomalies: List[AnomalyResponse] = []
    
    for entry in entries:
        if entry.resource_type != resource_type:
            continue
            
        z_score = (entry.amount - baseline.mean) / baseline.std_dev
        
        if abs(z_score) >= z_threshold:
            severity = "severe" if abs(z_score) >= 3.0 else "moderate"
            direction = "above" if z_score > 0 else "below"
            
            explanation = (
                f"Observed {entry.amount} {entry.unit} is {abs(round(z_score, 2))} standard deviations "
                f"{direction} historical mean ({baseline.mean} {entry.unit}). "
                f"Note: A deviation flags an unusual pattern for review; it does not in itself prove waste or identify cause."
            )
            
            anomalies.append(
                AnomalyResponse(
                    entry_id=entry.id,
                    resource_type=entry.resource_type,
                    recorded_at=entry.recorded_at,
                    value=round(entry.amount, 3),
                    unit=entry.unit,
                    baseline_mean=baseline.mean,
                    baseline_std=baseline.std_dev,
                    z_score=round(z_score, 3),
                    severity=severity,
                    explanation=explanation,
                    is_anomaly=True
                )
            )

    return sorted(anomalies, key=lambda a: abs(a.z_score), reverse=True)
