import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_tournament_registration_and_phone_validations():
    # 1. Login as player
    login_res = client.post("/api/auth/login", json={
        "email": "player@playsport.com",
        "password": "Customer@123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get tournaments
    tourn_res = client.get("/api/tournaments")
    assert tourn_res.status_code == 200
    tournaments = tourn_res.json()
    if not tournaments:
        pytest.skip("No tournaments available for testing.")

    tourn_id = tournaments[0]["id"]

    # 2. Reject short phone number (5 digits)
    res_short = client.post(f"/api/tournaments/{tourn_id}/register-team", headers=headers, json={
        "team_name": "Test United FC",
        "captain_name": "Test Captain",
        "contact_phone": "12345",
        "members_count": 7
    })
    assert res_short.status_code == 422

    # 3. Reject 9-digit phone number
    res_9 = client.post(f"/api/tournaments/{tourn_id}/register-team", headers=headers, json={
        "team_name": "Test United FC",
        "captain_name": "Test Captain",
        "contact_phone": "984712345",
        "members_count": 7
    })
    assert res_9.status_code == 422

    # 4. Reject 11-digit phone number
    res_11 = client.post(f"/api/tournaments/{tourn_id}/register-team", headers=headers, json={
        "team_name": "Test United FC",
        "captain_name": "Test Captain",
        "contact_phone": "98471234567",
        "members_count": 7
    })
    assert res_11.status_code == 422

    # 5. Reject phone not starting with 6, 7, 8, 9
    res_prefix = client.post(f"/api/tournaments/{tourn_id}/register-team", headers=headers, json={
        "team_name": "Test United FC",
        "captain_name": "Test Captain",
        "contact_phone": "1234567890",
        "members_count": 7
    })
    assert res_prefix.status_code == 422

    # 6. Reject all identical digits phone
    res_identical = client.post(f"/api/tournaments/{tourn_id}/register-team", headers=headers, json={
        "team_name": "Test United FC",
        "captain_name": "Test Captain",
        "contact_phone": "0000000000",
        "members_count": 7
    })
    assert res_identical.status_code == 422

    # 7. Reject invalid captain name (pure digits)
    res_captain = client.post(f"/api/tournaments/{tourn_id}/register-team", headers=headers, json={
        "team_name": "Test United FC",
        "captain_name": "123456",
        "contact_phone": "9847123456",
        "members_count": 7
    })
    assert res_captain.status_code == 422

    # 8. Reject phone numbers where first 7 digits are identical (e.g. 9999999123)
    res_7same = client.post(f"/api/tournaments/{tourn_id}/register-team", headers=headers, json={
        "team_name": "Test United FC",
        "captain_name": "Test Captain",
        "contact_phone": "9999999123",
        "members_count": 7
    })
    assert res_7same.status_code == 422

    # 9. Accept phone numbers where first 6 digits are identical (e.g. 9999991234, 8888884321)
    from app.schemas.tournament import TeamRegisterRequest
    req1 = TeamRegisterRequest(
        team_name="Kerala Blasters",
        captain_name="Arjun Das",
        contact_phone="9999991234",
        members_count=7
    )
    assert req1.contact_phone == "9999991234"

    req2 = TeamRegisterRequest(
        team_name="Cochin United",
        captain_name="Sidharth Menon",
        contact_phone="8888884321",
        members_count=7
    )
    assert req2.contact_phone == "8888884321"

    # Reject 7 same via Pydantic model directly
    try:
        TeamRegisterRequest(
            team_name="Seven Nines",
            captain_name="Test Captain",
            contact_phone="9999999123",
            members_count=7
        )
        assert False, "Should have raised ValueError for first 7 digits same"
    except ValueError as e:
        assert "first 7 digits cannot be the same" in str(e).lower()
