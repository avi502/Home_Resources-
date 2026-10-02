def test_intelligence_and_simulation_endpoints(client, test_user):
    household_id = test_user["household"].id
    headers = {"Authorization": f"Bearer {test_user['token']}"}

    # Add several resource entries to establish baseline
    for i in range(8):
        client.post(
            f"/api/v1/resources/{household_id}/entries",
            json={"resource_type": "water", "amount": 350.0 + i * 2, "unit": "L", "cost": 1.4},
            headers=headers
        )

    # 1. Baseline endpoint
    res_base = client.get(f"/api/v1/intelligence/{household_id}/baseline/water", headers=headers)
    assert res_base.status_code == 200
    base_data = res_base.json()["data"]
    assert base_data["sample_count"] == 8
    assert base_data["is_reliable"] is True
    assert base_data["unit"] == "L"

    # 2. Relationship graph endpoint
    res_rel = client.get(f"/api/v1/intelligence/{household_id}/relationships", headers=headers)
    assert res_rel.status_code == 200
    rel_data = res_rel.json()["data"]
    assert len(rel_data["nodes"]) >= 4
    assert len(rel_data["edges"]) >= 2

    # 3. Presets
    res_presets = client.get("/api/v1/simulation/presets", headers=headers)
    assert res_presets.status_code == 200
    assert len(res_presets.json()["data"]) >= 3

    # 4. Run Simulation
    sim_payload = {
        "name": "15% Water Reduction Test",
        "target_resource": "water",
        "change_percentage": -15.0,
        "water_pump_model": True
    }
    res_sim = client.post(f"/api/v1/simulation/{household_id}/simulate", json=sim_payload, headers=headers)
    assert res_sim.status_code == 200
    sim_data = res_sim.json()["data"]
    assert sim_data["target_resource"] == "water"
    assert sim_data["change_percentage"] == -15.0
    assert "savings_uncertainty" in sim_data
