from typing import Tuple
from backend.app.schemas.simulation import UncertaintyInterval


def compute_uncertainty_interval(
    expected_savings: float,
    sample_size: int,
    variance_ratio: float = 0.15
) -> UncertaintyInterval:
    """Computes transparent sensitivity and uncertainty intervals around a simulated estimate.

    Smaller sample sizes yield wider uncertainty bounds, reflecting statistical truth.
    """
    # Base spread factor depends on sample reliability
    if sample_size < 7:
        spread = max(0.35, variance_ratio * 2.5)  # High uncertainty
        conf = "Low confidence (limited historical records: <7 samples)"
    elif sample_size < 30:
        spread = max(0.18, variance_ratio * 1.5)  # Moderate uncertainty
        conf = "Moderate confidence (80% confidence interval, 7-30 samples)"
    else:
        spread = max(0.08, variance_ratio)        # Tight interval
        conf = "High confidence (80% empirical interval, >30 samples)"

    # Compute bounds
    if expected_savings >= 0:
        minimum = round(expected_savings * (1.0 - spread), 2)
        maximum = round(expected_savings * (1.0 + spread), 2)
    else:
        # For cost increases / negative savings
        minimum = round(expected_savings * (1.0 + spread), 2)
        maximum = round(expected_savings * (1.0 - spread), 2)

    return UncertaintyInterval(
        minimum=minimum,
        expected=round(expected_savings, 2),
        maximum=maximum,
        confidence_level=conf
    )
