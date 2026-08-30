import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_open_match_capacity_guard():
    # Login customer 1
    login1 = client.post("/api/auth/login", json={
        "email": "arjun.nair@example.com",
        "password": "Customer@123"
    })
    headers1 = {"Authorization": f"Bearer {login1.json()['access_token']}"}

    # 1. Create a match with max_players = 2
    match_payload = {
        "turf_id": 1,
        "ground_id": 1,
        "title": "Strict 2-Player Test Match",
        "sport_type": "Badminton",
        "skill_level": "Intermediate",
        "match_date": "2026-10-20",
        "start_time": "06:00 PM",
        "end_time": "07:00 PM",
        "max_players": 2, # Only 2 players allowed (Creator + 1 joiner)
        "price_per_player": 100.0
    }
    create_res = client.post("/api/open-matches", json=match_payload, headers=headers1)
    assert create_res.status_code == 201
    match_id = create_res.json()["id"]

    # 2. Login customer 2 and join (fills the 2nd slot -> match becomes FULL)
    login2 = client.post("/api/auth/login", json={
        "email": "rahul.kumar@example.com",
        "password": "Customer@123"
    })
    headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}
    join2_res = client.post(f"/api/open-matches/{match_id}/join", headers=headers2)
    assert join2_res.status_code == 200
    assert join2_res.json()["current_players"] == 2
    assert join2_res.json()["status"] == "FULL"

    # 3. Login customer 3 and attempt to join (3rd player exceeds capacity 2)
    login3 = client.post("/api/auth/login", json={
        "email": "sarah.j@example.com",
        "password": "Customer@123"
    })
    headers3 = {"Authorization": f"Bearer {login3.json()['access_token']}"}
    join3_res = client.post(f"/api/open-matches/{match_id}/join", headers=headers3)
    
    # Participant guard MUST reject with 400 Bad Request
    assert join3_res.status_code == 400
    assert "FULL" in join3_res.json()["detail"] or "capacity" in join3_res.json()["detail"]
