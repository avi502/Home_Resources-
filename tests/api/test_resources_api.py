def test_resource_crud_lifecycle(client, test_user):
    household_id = test_user["household"].id
    headers = {"Authorization": f"Bearer {test_user['token']}"}

    # 1. Add valid entry
    payload = {
        "resource_type": "electricity",
        "amount": 7.5,
        "unit": "kWh",
        "cost": 1.35,
        "activity_tag": "hvac",
        "notes": "Evening heat pump run"
    }
    res = client.post(f"/api/v1/resources/{household_id}/entries", json=payload, headers=headers)
    assert res.status_code == 201
    entry_id = res.json()["data"]["id"]
    assert res.json()["data"]["amount"] == 7.5
    assert res.json()["data"]["unit"] == "kWh"

    # 2. List entries
    res_list = client.get(f"/api/v1/resources/{household_id}/entries", headers=headers)
    assert res_list.status_code == 200
    entries = res_list.json()["data"]
    assert any(e["id"] == entry_id for e in entries)

    # 3. Dashboard summary
    res_dash = client.get(f"/api/v1/resources/{household_id}/dashboard", headers=headers)
    assert res_dash.status_code == 200
    dash_data = res_dash.json()["data"]
    assert dash_data["household_name"] == "Primary Residence"
    assert len(dash_data["summaries"]) >= 5

    # 4. Delete entry
    res_del = client.delete(f"/api/v1/resources/{household_id}/entries/{entry_id}", headers=headers)
    assert res_del.status_code == 200


def test_resource_invalid_unit_validation(client, test_user):
    household_id = test_user["household"].id
    headers = {"Authorization": f"Bearer {test_user['token']}"}

    payload = {
        "resource_type": "electricity",
        "amount": 5.0,
        "unit": "invalid_unit_xyz",
        "cost": 1.0
    }
    res = client.post(f"/api/v1/resources/{household_id}/entries", json=payload, headers=headers)
    assert res.status_code == 422  # Pydantic validation error
