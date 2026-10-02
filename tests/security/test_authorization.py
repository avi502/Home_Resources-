"""Security Regression & Household-Level Authorization Tests.

Required by Section 7 of the HomeResource blueprint:
'Write tests that attempt to access another user's household data.'
'Never trust the frontend to enforce access permissions.'
"""


def test_cannot_access_another_users_household_dashboard(client, test_user, second_user):
    """User 1 attempts to query User 2's private household dashboard."""
    stranger_household_id = second_user["household"].id
    headers = {"Authorization": f"Bearer {test_user['token']}"}

    res = client.get(f"/api/v1/resources/{stranger_household_id}/dashboard", headers=headers)
    assert res.status_code == 403
    assert "access denied" in res.json()["detail"].lower()


def test_cannot_post_entries_to_another_users_household(client, test_user, second_user):
    """User 1 attempts to inject telemetry into User 2's household."""
    stranger_household_id = second_user["household"].id
    headers = {"Authorization": f"Bearer {test_user['token']}"}

    payload = {
        "resource_type": "electricity",
        "amount": 99.0,
        "unit": "kWh",
        "cost": 15.0
    }
    res = client.post(f"/api/v1/resources/{stranger_household_id}/entries", json=payload, headers=headers)
    assert res.status_code == 403
    assert "access denied" in res.json()["detail"].lower()


def test_cannot_access_another_users_intelligence_telemetry(client, test_user, second_user):
    """User 1 attempts to read User 2's baseline or anomaly models."""
    stranger_household_id = second_user["household"].id
    headers = {"Authorization": f"Bearer {test_user['token']}"}

    res = client.get(f"/api/v1/intelligence/{stranger_household_id}/baseline/electricity", headers=headers)
    assert res.status_code == 403


def test_cannot_export_or_wipe_another_users_data(client, test_user, second_user):
    """User 1 attempts to download or wipe User 2's telemetry."""
    stranger_household_id = second_user["household"].id
    headers = {"Authorization": f"Bearer {test_user['token']}"}

    # Attempt export
    res_export = client.get(f"/api/v1/export/{stranger_household_id}/json", headers=headers)
    assert res_export.status_code == 403

    # Attempt wipe
    res_wipe = client.post(f"/api/v1/export/{stranger_household_id}/wipe", headers=headers)
    assert res_wipe.status_code == 403


def test_unauthenticated_request_rejected(client, test_user):
    """Requests with missing or invalid tokens are strictly rejected."""
    household_id = test_user["household"].id

    res_no_auth = client.get(f"/api/v1/resources/{household_id}/dashboard")
    assert res_no_auth.status_code == 401

    res_fake_token = client.get(
        f"/api/v1/resources/{household_id}/dashboard",
        headers={"Authorization": "Bearer invalid.token.payload"}
    )
    assert res_fake_token.status_code == 401
