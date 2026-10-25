import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.turf import Turf
from app.models.ground import Ground
from app.models.slot import TimeSlot, SlotStatusEnum
from app.models.equipment import Equipment

client = TestClient(app)

def test_booking_slot_with_equipment_rental():
    db = SessionLocal()
    turf = db.query(Turf).first()
    ground = db.query(Ground).filter(Ground.turf_id == turf.id).first()
    equipment = db.query(Equipment).filter(Equipment.turf_id == turf.id, Equipment.available_quantity > 0).first()
    
    assert turf is not None
    assert ground is not None
    assert equipment is not None
    
    initial_qty = equipment.available_quantity

    # 1. Login as player
    login_res = client.post("/api/auth/login", json={
        "email": "player@playsport.com",
        "password": "Customer@123"
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Find an available slot
    slot = db.query(TimeSlot).filter(TimeSlot.ground_id == ground.id, TimeSlot.status == SlotStatusEnum.AVAILABLE).first()
    if not slot:
        # Create a test slot if none
        slot = TimeSlot(
            ground_id=ground.id,
            slot_date="2026-11-01",
            start_time="09:00 AM",
            end_time="10:00 AM",
            price=1000.0,
            status=SlotStatusEnum.AVAILABLE
        )
        db.add(slot)
        db.commit()
        db.refresh(slot)

    slot_id = slot.id
    slot_price = slot.price
    rent_qty = 2
    eq_price = equipment.price_per_hour * rent_qty # 1 hour slot
    expected_total = slot_price + eq_price

    # 3. Create booking with slot and equipment together
    booking_payload = {
        "turf_id": turf.id,
        "ground_id": ground.id,
        "booking_date": slot.slot_date,
        "slot_ids": [slot_id],
        "payment_method": "UPI",
        "customer_notes": "Testing slot + equipment rental together",
        "equipment_rentals": [
            {
                "equipment_id": equipment.id,
                "quantity": rent_qty
            }
        ]
    }

    res = client.post("/api/bookings/create", headers=headers, json=booking_payload)
    assert res.status_code == 201, f"Booking creation failed: {res.text}"
    booking_data = res.json()

    assert booking_data["final_amount"] == expected_total
    assert len(booking_data["equipment_rentals"]) == 1
    assert booking_data["equipment_rentals"][0]["quantity"] == rent_qty
    assert booking_data["equipment_rentals"][0]["equipment_id"] == equipment.id

    # 4. Verify equipment stock decreased
    db.expire_all()
    updated_eq = db.query(Equipment).filter(Equipment.id == equipment.id).first()
    assert updated_eq.available_quantity == initial_qty - rent_qty

    # 5. Verify /my-bookings returns equipment rentals
    my_res = client.get("/api/bookings/my-bookings", headers=headers)
    assert my_res.status_code == 200
    my_bookings = my_res.json()
    created_booking = next((b for b in my_bookings if b["id"] == booking_data["id"]), None)
    assert created_booking is not None
    assert len(created_booking["equipment_rentals"]) == 1

    # 6. Test cancel booking restocks equipment
    cancel_res = client.post(f"/api/bookings/{booking_data['id']}/cancel", headers=headers, json={
        "reason": "Test cancellation"
    })
    assert cancel_res.status_code == 200

    db.expire_all()
    restocked_eq = db.query(Equipment).filter(Equipment.id == equipment.id).first()
    assert restocked_eq.available_quantity == initial_qty

    db.close()
