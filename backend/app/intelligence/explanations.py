from typing import List, Dict, Any
from backend.app.schemas.intelligence import AnomalyResponse, BaselineResponse


def generate_anomaly_explanation(anomaly: AnomalyResponse, context_entries_count: int) -> Dict[str, Any]:
    """Generates an objective, deterministic explanation grounded entirely in observed metrics.

    Guarantees no fabricated AI assertions or unverified causal claims.
    """
    direction = "spike" if anomaly.z_score > 0 else "drop"
    percent_diff = round(((anomaly.value - anomaly.baseline_mean) / (anomaly.baseline_mean or 1.0)) * 100, 1)

    return {
        "summary": f"{anomaly.severity.capitalize()} {direction} in {anomaly.resource_type} usage ({percent_diff:+}%)",
        "evidence": [
            f"Observed value: {anomaly.value} {anomaly.unit}",
            f"Historical baseline mean: {anomaly.baseline_mean} {anomaly.unit}",
            f"Standard deviation (σ): {anomaly.baseline_std} {anomaly.unit}",
            f"Standardized z-score: {anomaly.z_score:+.2f} (Threshold: ±2.0)",
            f"Context window: {context_entries_count} historical entries analyzed"
        ],
        "system_safeguard": (
            "Statistical deviation flags unusual telemetry for human inspection. "
            "It does not independently establish user error, appliance malfunction, or waste."
        )
    }
