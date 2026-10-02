from datetime import datetime, timezone
from backend.app.simulation.engine import run_simulation
from backend.app.schemas.simulation import SimulationRequest
from backend.app.models.household import Household
from backend.app.models.resource_entry import ResourceEntry


def test_simulation_water_reduction_with_pump_cascading():
    now = datetime.now(timezone.utc)
    household = Household(
        id=1,
        name="Eco Home",
        owner_id=1,
        currency="USD",
        timezone="UTC",
        electricity_tariff_rate=0.20, # $0.20/kWh
        water_tariff_rate=0.005        # $0.005/L
    )

    # 10 entries of water at 400 L
    entries = [
        ResourceEntry(id=i, household_id=1, resource_type="water", amount=400.0, unit="L", recorded_at=now)
        for i in range(10)
    ]
    # Add electricity baseline entries
    entries += [
        ResourceEntry(id=100+i, household_id=1, resource_type="electricity", amount=10.0, unit="kWh", recorded_at=now)
        for i in range(10)
    ]

    req = SimulationRequest(
        name="15% Water Reduction",
        target_resource="water",
        change_percentage=-15.0,
        water_pump_model=True,
        pump_energy_intensity=0.0012
    )

    result = run_simulation(household, entries, req)

    # 15% reduction from 400 = 340 L
    assert result.baseline_usage == 400.0
    assert result.simulated_usage == 340.0
    assert result.usage_delta == -60.0

    # Cascading impacts: pump electricity should be reduced
    assert len(result.cascading_impacts) >= 1
    cascading_elec = result.cascading_impacts[0]
    assert cascading_elec["resource"] == "electricity"
    assert cascading_elec["delta_amount"] < 0  # electricity reduced

    # Uncertainty bounds
    assert result.savings_uncertainty.minimum <= result.savings_uncertainty.expected <= result.savings_uncertainty.maximum
    assert len(result.assumptions) >= 2
    assert "hydrodynamic" in cascading_elec["notes"].lower()
