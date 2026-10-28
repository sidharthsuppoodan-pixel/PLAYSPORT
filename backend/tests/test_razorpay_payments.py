import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.turf import Turf
from app.models.ground import Ground
from app.models.slot import TimeSlot, SlotStatusEnum
from app.models.equipment import Equipment
from app.services.razorpay_service import razorpay_service

client = TestClient(app)

def get_auth_token():
    login_res = client.post("/api/auth/login", json={
        "email": "player@playsport.com",
        "password": "Customer@123"
    })
    assert login_res.status_code == 200
    return login_res.json()["access_token"]

def test_razorpay_config():
    res = client.get("/api/payments/razorpay/config")
    assert res.status_code == 200
    data = res.json()
    assert "key_id" in data
    assert data["currency"] == "INR"

def test_razorpay_turf_booking_end_to_end():
    db = SessionLocal()
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    turf = db.query(Turf).first()
    ground = db.query(Ground).filter(Ground.turf_id == turf.id).first()
    equipment = db.query(Equipment).filter(Equipment.turf_id == turf.id, Equipment.available_quantity >= 2).first()

    # Clean up or create available slot for test
    test_date = f"2026-11-20"
    test_time = f"07:{uuid.uuid4().hex[:2]} AM"
    slot = TimeSlot(
        ground_id=ground.id,
        slot_date=test_date,
        start_time=test_time,
        end_time="08:00 AM",
        price=1200.0,
        status=SlotStatusEnum.AVAILABLE
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)

    # 1. Create Razorpay Turf Order
    order_payload = {
        "turf_id": turf.id,
        "ground_id": ground.id,
        "booking_date": test_date,
        "slot_ids": [slot.id],
        "equipment_rentals": [
            {"equipment_id": equipment.id, "quantity": 1}
        ]
    }
    order_res = client.post("/api/payments/razorpay/create-turf-order", headers=headers, json=order_payload)
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert "order_id" in order_data
    expected_total = 1200.0 + equipment.price_per_hour
    assert order_data["total_amount_inr"] == expected_total

    # 2. Verify Razorpay Payment & Confirm Turf Booking
    verify_payload = {
        "razorpay_order_id": order_data["order_id"],
        "razorpay_payment_id": f"pay_test_{order_data['order_id'][-8:]}",
        "razorpay_signature": "mock_signature_verified",
        "payment_method": "UPI",
        "turf_id": turf.id,
        "ground_id": ground.id,
        "booking_date": test_date,
        "slot_ids": [slot.id],
        "customer_notes": "Test razorpay turf booking with gear",
        "equipment_rentals": [
            {"equipment_id": equipment.id, "quantity": 1}
        ]
    }
    verify_res = client.post("/api/payments/razorpay/verify-turf-booking", headers=headers, json=verify_payload)
    assert verify_res.status_code == 201
    booking_detail = verify_res.json()
    assert booking_detail["final_amount"] == expected_total
    assert booking_detail["payment_status"] == "SUCCESS"
    assert len(booking_detail["equipment_rentals"]) == 1

    # Verify slot is booked in DB
    db.refresh(slot)
    assert slot.status == SlotStatusEnum.BOOKED

    # 3. Verify receipt endpoint
    receipt_res = client.get(f"/api/payments/receipt/{booking_detail['id']}", headers=headers)
    assert receipt_res.status_code == 200
    receipt_data = receipt_res.json()
    assert receipt_data["status"] == "SUCCESS"
    assert receipt_data["amount"] == expected_total

    db.close()

def test_razorpay_standalone_equipment_rental_end_to_end():
    db = SessionLocal()
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    turf = db.query(Turf).first()
    equipment = db.query(Equipment).filter(Equipment.turf_id == turf.id, Equipment.available_quantity >= 2).first()
    initial_qty = equipment.available_quantity

    # 1. Create Razorpay Equipment Order
    rent_qty = 2
    rent_hours = 3
    expected_cost = equipment.price_per_hour * rent_qty * rent_hours

    order_payload = {
        "turf_id": turf.id,
        "items": [{"equipment_id": equipment.id, "quantity": rent_qty}],
        "rental_date": "2026-11-06",
        "hours": rent_hours
    }
    order_res = client.post("/api/payments/razorpay/create-equipment-order", headers=headers, json=order_payload)
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert order_data["total_amount_inr"] == expected_cost

    # 2. Verify Razorpay Payment & Confirm Standalone Equipment Rental
    verify_payload = {
        "razorpay_order_id": order_data["order_id"],
        "razorpay_payment_id": f"pay_test_{order_data['order_id'][-8:]}",
        "razorpay_signature": "mock_signature_verified",
        "payment_method": "UPI",
        "turf_id": turf.id,
        "items": [{"equipment_id": equipment.id, "quantity": rent_qty}],
        "rental_date": "2026-11-06",
        "hours": rent_hours,
        "customer_notes": "Standalone equipment reservation via Razorpay"
    }
    verify_res = client.post("/api/payments/razorpay/verify-equipment-rental", headers=headers, json=verify_payload)
    assert verify_res.status_code == 201
    rental_detail = verify_res.json()
    assert rental_detail["final_amount"] == expected_cost
    assert rental_detail["payment_status"] == "SUCCESS"
    assert len(rental_detail["equipment_rentals"]) == 1
    assert rental_detail["equipment_rentals"][0]["quantity"] == rent_qty

    # Check equipment stock decreased
    db.expire_all()
    updated_eq = db.query(Equipment).filter(Equipment.id == equipment.id).first()
    assert updated_eq.available_quantity == initial_qty - rent_qty

    # Verify /my-bookings returns this rental
    my_bookings_res = client.get("/api/bookings/my-bookings", headers=headers)
    assert my_bookings_res.status_code == 200
    my_bookings = my_bookings_res.json()
    rental_entry = next((b for b in my_bookings if b["id"] == rental_detail["id"]), None)
    assert rental_entry is not None
    assert rental_entry["booking_reference"].startswith("EQP-")

    db.close()
