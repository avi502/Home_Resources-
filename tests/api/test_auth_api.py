def test_register_and_login_flow(client):
    # 1. Register
    reg_payload = {
        "email": "newuser@homeresource.local",
        "password": "Password123!",
        "full_name": "Jordan Lee"
    }
    res_reg = client.post("/api/v1/auth/register", json=reg_payload)
    assert res_reg.status_code == 201
    reg_data = res_reg.json()["data"]
    assert reg_data["email"] == "newuser@homeresource.local"
    assert reg_data["full_name"] == "Jordan Lee"

    # 2. Login
    login_payload = {
        "email": "newuser@homeresource.local",
        "password": "Password123!"
    }
    res_login = client.post("/api/v1/auth/login", json=login_payload)
    assert res_login.status_code == 200
    token_data = res_login.json()["data"]
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"
    assert token_data["household_id"] is not None

    # 3. Get /me
    token = token_data["access_token"]
    res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["data"]["email"] == "newuser@homeresource.local"


def test_login_invalid_password(client, test_user):
    login_payload = {
        "email": test_user["user"].email,
        "password": "WrongPassword!"
    }
    res = client.post("/api/v1/auth/login", json=login_payload)
    assert res.status_code == 401
