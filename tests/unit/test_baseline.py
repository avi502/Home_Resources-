import pytest
from datetime import datetime, timezone
from backend.app.intelligence.baseline import calculate_baseline
from backend.app.models.resource_entry import ResourceEntry


def test_baseline_calculation_basic():
    # 7 sample values: mean = (4+5+6+5+5+4+6)/7 = 5.0
    amounts = [4.0, 5.0, 6.0, 5.0, 5.0, 4.0, 6.0]
    entries = [
        ResourceEntry(
            id=i,
            household_id=1,
            resource_type="electricity",
            amount=a,
            unit="kWh",
            recorded_at=datetime.now(timezone.utc)
        )
        for i, a in enumerate(amounts)
    ]

    baseline = calculate_baseline(entries, "electricity")

    assert baseline.sample_count == 7
    assert baseline.is_reliable is True
    assert baseline.mean == 5.0
    assert baseline.median == 5.0
    assert baseline.min_value == 4.0
    assert baseline.max_value == 6.0
    assert baseline.unit == "kWh"


def test_baseline_insufficient_samples():
    entries = [
        ResourceEntry(
            id=1,
            household_id=1,
            resource_type="electricity",
            amount=5.0,
            unit="kWh",
            recorded_at=datetime.now(timezone.utc)
        )
    ]
    baseline = calculate_baseline(entries, "electricity")
    # Small sample (< 7 observations) marked unreliable per Blueprint Section 6
    assert baseline.sample_count == 1
    assert baseline.is_reliable is False


def test_baseline_empty():
    baseline = calculate_baseline([], "water")
    assert baseline.sample_count == 0
    assert baseline.mean == 0.0
    assert baseline.is_reliable is False
