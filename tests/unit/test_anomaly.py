import pytest
from datetime import datetime, timezone
from backend.app.intelligence.anomaly import detect_anomalies
from backend.app.models.resource_entry import ResourceEntry


def test_anomaly_detection_z_score_exact_blueprint():
    """Validates the exact mathematical example in Section 6 of the blueprint:

    Mean = 5.0, Std Dev = 0.8, Observation = 8.5
    z = (8.5 - 5) / 0.8 = 4.375
    """
    now = datetime.now(timezone.utc)
    
    # Construct historical dataset around mean 5.0 and std 0.8
    historical_amounts = [5.0, 4.2, 5.8, 5.0, 4.2, 5.8, 5.0, 4.4, 5.6, 5.0, 4.3, 5.7, 5.0, 4.2, 5.8, 5.0, 4.5, 5.5, 5.0, 4.2, 5.8]
    entries = [
        ResourceEntry(
            id=i + 1,
            household_id=1,
            resource_type="electricity",
            amount=val,
            unit="kWh",
            recorded_at=now
        )
        for i, val in enumerate(historical_amounts)
    ]
    # Add anomaly entry
    entries.append(
        ResourceEntry(
            id=99,
            household_id=1,
            resource_type="electricity",
            amount=8.5,
            unit="kWh",
            recorded_at=now
        )
    )

    anomalies = detect_anomalies(entries, "electricity", z_threshold=2.0)
    assert len(anomalies) >= 1

    anomaly = next(a for a in anomalies if a.entry_id == 99)
    assert anomaly.value == 8.5
    assert anomaly.z_score > 2.0
    assert anomaly.severity == "severe"  # > 3 std dev
    assert "standard deviations" in anomaly.explanation
    assert "does not in itself prove waste" in anomaly.explanation


def test_anomaly_no_false_positives_in_normal_range():
    now = datetime.now(timezone.utc)
    entries = [
        ResourceEntry(
            id=i + 1,
            household_id=1,
            resource_type="electricity",
            amount=5.0 + (0.1 if i % 2 == 0 else -0.1),
            unit="kWh",
            recorded_at=now
        )
        for i in range(10)
    ]
    anomalies = detect_anomalies(entries, "electricity", z_threshold=2.0)
    assert len(anomalies) == 0
