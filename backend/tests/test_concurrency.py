import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from app.main import app

client = TestClient(app)

def test_booking_and_double_booking_prevention():
    # 1. Login as customer 1
    login1 = client.post("/api/auth/login", json={
        "email": "arjun.nair@example.com",
        "password": "Customer@123"
    })
    token1 = login1.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # 2. Login as customer 2
    login2 = client.post("/api/auth/login", json={
        "email": "rahul.kumar@example.com",
        "password": "Customer@123"
    })
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # 0. Generate slots as owner for tomorrow
    owner_login = client.post("/api/auth/login", json={
        "email": "owner.kochi@playsport.com",
        "password": "Owner@123"
    })
    owner_token = owner_login.json()["access_token"]
    owner_headers = {"Authorization": f"Bearer {owner_token}"}
    tomorrow_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    client.post("/api/slots/batch-generate", json={
        "turf_id": 1,
        "start_date": tomorrow_str,
        "end_date": tomorrow_str,
        "start_time_hour": 14,
        "end_time_hour": 18,
        "hourly_price": 1500.0
    }, headers=owner_headers)

    # 3. Retrieve available slots for PlayZone Arena (turf id 1, ground id 1)
    slots_res = client.get("/api/slots/by-ground/1?days=2")
    assert slots_res.status_code == 200
    days_data = slots_res.json()
    
    # Pick a date with available slots
    target_date = days_data[1]["date"] # Tomorrow
    available_slots = [s for s in days_data[1]["slots"] if s["status"] == "AVAILABLE"]
    assert len(available_slots) >= 1
    slot_to_book = available_slots[0]

    # 4. Customer 1 books the slot
    book_payload = {
        "turf_id": 1,
        "ground_id": 1,
        "booking_date": target_date,
        "slot_ids": [slot_to_book["id"]],
        "payment_method": "UPI",
        "customer_notes": "First customer confirmed booking"
    }
    book1_res = client.post("/api/bookings/create", json=book_payload, headers=headers1)
    assert book1_res.status_code == 201
    booking1 = book1_res.json()
    assert booking1["booking_reference"].startswith("STC-")
    assert booking1["status"] == "CONFIRMED"

    # 5. Customer 2 attempts to book the EXACT same slot (Collision Attempt)
    book2_res = client.post("/api/bookings/create", json=book_payload, headers=headers2)
    
    # Concurrency guard MUST reject with 409 Conflict
    assert book2_res.status_code == 409
    error_msg = book2_res.json()["detail"]
    assert "already booked" in error_msg or "Double-booking prevented" in error_msg
