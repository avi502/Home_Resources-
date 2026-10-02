from datetime import datetime, timezone
from backend.app.intelligence.relationships import build_relationship_graph, pearson_correlation
from backend.app.models.resource_entry import ResourceEntry


def test_pearson_correlation_perfect():
    x = [1.0, 2.0, 3.0, 4.0, 5.0]
    y = [2.0, 4.0, 6.0, 8.0, 10.0]
    r = pearson_correlation(x, y)
    assert round(r, 4) == 1.0


def test_relationship_graph_structure():
    now = datetime.now(timezone.utc)
    entries = [
        ResourceEntry(id=1, household_id=1, resource_type="water", amount=300.0, unit="L", recorded_at=now),
        ResourceEntry(id=2, household_id=1, resource_type="time", amount=1.5, unit="hrs", recorded_at=now),
        ResourceEntry(id=3, household_id=1, resource_type="electricity", amount=5.0, unit="kWh", recorded_at=now),
        ResourceEntry(id=4, household_id=1, resource_type="money", amount=20.0, unit="USD", recorded_at=now),
        ResourceEntry(id=5, household_id=1, resource_type="food", amount=2.0, unit="kg", recorded_at=now),
    ]

    graph = build_relationship_graph(entries)

    node_ids = [n.id for n in graph.nodes]
    assert "water" in node_ids
    assert "pump_runtime" in node_ids
    assert "electricity" in node_ids
    assert "utility_bill" in node_ids
    assert "food" in node_ids

    # Verify safeguard presence
    assert "Statistical correlation does not imply causation" in graph.correlation_safeguard_note
    # Verify water -> pump runtime is marked not causal (safeguard)
    water_pump_edge = next(e for e in graph.edges if e.source == "water" and e.target == "pump_runtime")
    assert water_pump_edge.is_causal is False
