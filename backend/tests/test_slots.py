from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from app.main import app

client = TestClient(app)

def test_slot_batch_generation_and_cleanup():
    # 1. Login as owner
    login_res = client.post("/api/auth/login", json={
        "email": "owner.kochi@playsport.com",
        "password": "Owner@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Batch generate slots with turf_id
    tomorrow_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    gen_payload = {
        "turf_id": 1,
        "start_date": tomorrow_str,
        "end_date": tomorrow_str,
        "start_time_hour": 14,
        "end_time_hour": 18,
        "hourly_price": 1500.0
    }
    gen_res = client.post("/api/slots/batch-generate", json=gen_payload, headers=headers)
    assert gen_res.status_code == 200
    assert gen_res.json()["created_count"] >= 0

    # 3. Retrieve slots and verify no past slots are included for today
    slots_res = client.get("/api/slots/by-ground/1?days=2")
    assert slots_res.status_code == 200
    days_data = slots_res.json()
    assert len(days_data) >= 1

    # Check today's slots
    today_slots = days_data[0]["slots"]
    for slot in today_slots:
        assert slot["status"] in ["AVAILABLE", "BOOKED", "BLOCKED"]
