from typing import List, Dict, Any

PRESET_SCENARIOS: List[Dict[str, Any]] = [
    {
        "id": "water_reduction_15",
        "name": "15% Water Conservation & Pump Relief",
        "description": "Reduces domestic flow via low-flow aerators and fixes leaks, reducing well/booster pump run time.",
        "target_resource": "water",
        "change_percentage": -15.0,
        "water_pump_model": True,
        "pump_energy_intensity": 0.0012,
        "tags": ["water", "pump", "electricity"]
    },
    {
        "id": "appliance_efficiency_20",
        "name": "20% Electrical Load Optimization",
        "description": "Simulates swapping aging refrigeration or adjusting HVAC cooling setpoints by 1.5°C.",
        "target_resource": "electricity",
        "change_percentage": -20.0,
        "water_pump_model": False,
        "tags": ["electricity", "hvac", "grid"]
    },
    {
        "id": "food_waste_curtailment",
        "name": "Food Waste Reduction & Meal Planning",
        "description": "Simulates 25% reduction in spoiled pantry inventory through smart inventory rotation.",
        "target_resource": "food",
        "change_percentage": -25.0,
        "water_pump_model": False,
        "tags": ["food", "groceries", "time"]
    }
]
