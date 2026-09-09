import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_open_match_capacity_guard():
    # Login owner to create match
    login1 = client.post("/api/auth/login", json={
        "email": "owner.kochi@playsport.com",
        "password": "Owner@123"
    })
    headers1 = {"Authorization": f"Bearer {login1.json()['access_token']}"}

    import uuid, random
    random_day = random.randint(10, 28)
    unique_date = f"2026-11-{random_day}"
    start_hr = 10 + (random.randint(0, 8))
    unique_time = f"{start_hr:02d}:00"
    end_time_str = f"{start_hr+1:02d}:00"

    # 1. Create a match with max_players = 2
    match_payload = {
        "turf_id": 1,
        "ground_id": 1,
        "title": f"Strict 2-Player Test Match {uuid.uuid4().hex[:4]}",
        "sport_type": "Badminton",
        "skill_level": "Intermediate",
        "match_date": unique_date,
        "start_time": unique_time,
        "end_time": end_time_str,
        "max_players": 2, # Only 2 players allowed (Creator + 1 joiner)
        "price_per_player": 100.0
    }
    create_res = client.post("/api/open-matches", json=match_payload, headers=headers1)
    assert create_res.status_code == 201, f"Failed to create test match: {create_res.text}"
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
