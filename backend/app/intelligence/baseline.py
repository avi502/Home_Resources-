from typing import List, Dict, Optional
import math
from backend.app.models.resource_entry import ResourceEntry
from backend.app.schemas.intelligence import BaselineResponse


def calculate_baseline(entries: List[ResourceEntry], resource_type: str) -> BaselineResponse:
    """Calculates statistical baseline (mean, standard deviation, median, min, max)

    for a specified resource type based on historical records.
    """
    filtered = [e.amount for e in entries if e.resource_type == resource_type]
    count = len(filtered)
    
    unit = "units"
    if entries:
        for e in entries:
            if e.resource_type == resource_type:
                unit = e.unit
                break

    if count == 0:
        return BaselineResponse(
            resource_type=resource_type,
            mean=0.0,
            std_dev=0.0,
            median=0.0,
            min_value=0.0,
            max_value=0.0,
            unit=unit,
            sample_count=0,
            is_reliable=False
        )

    # Arithmetic mean
    mean = sum(filtered) / count
    
    # Sample standard deviation (Bessel's correction n-1 if count > 1)
    if count > 1:
        variance = sum((x - mean) ** 2 for x in filtered) / (count - 1)
        std_dev = math.sqrt(variance)
    else:
        std_dev = 0.0

    # Median
    sorted_vals = sorted(filtered)
    if count % 2 == 1:
        median = sorted_vals[count // 2]
    else:
        median = (sorted_vals[count // 2 - 1] + sorted_vals[count // 2]) / 2.0

    min_val = min(filtered)
    max_val = max(filtered)
    
    # Blueprint requirement: account for small datasets (reliable if >= 7 observations)
    is_reliable = count >= 7

    return BaselineResponse(
        resource_type=resource_type,
        mean=round(mean, 3),
        std_dev=round(std_dev, 3),
        median=round(median, 3),
        min_value=round(min_val, 3),
        max_value=round(max_val, 3),
        unit=unit,
        sample_count=count,
        is_reliable=is_reliable
    )
