import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from app.main import app
from app.core.database import SessionLocal
from app.models.booking import Booking, BookingStatusEnum
from app.models.open_match import OpenMatch, MatchStatusEnum, MatchParticipant
from app.models.user import User

import uuid

client = TestClient(app)

def test_past_booking_cannot_be_cancelled():
    db = SessionLocal()
    booking_id = None
    try:
        # Get customer user
        user = db.query(User).filter(User.email == "rahul.kumar@example.com").first()
        assert user is not None

        # Create a past booking for rahul
        past_booking = Booking(
            user_id=user.id,
            turf_id=1,
            ground_id=1,
            booking_reference=f"PB-{uuid.uuid4().hex[:8].upper()}",
            booking_date="2020-01-01",
            start_time="09:00 AM",
            end_time="10:00 AM",
            total_amount=500.0,
            discount_amount=0.0,
            final_amount=500.0,
            status=BookingStatusEnum.CONFIRMED,
            customer_notes="Past booking test"
        )
        db.add(past_booking)
        db.commit()
        db.refresh(past_booking)
        booking_id = past_booking.id

        # Login as Rahul
        login_res = client.post("/api/auth/login", json={
            "email": "rahul.kumar@example.com",
            "password": "Customer@123"
        })
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 1. Fetch my bookings and check can_cancel and is_past
        my_bookings_res = client.get("/api/bookings/my-bookings", headers=headers)
        assert my_bookings_res.status_code == 200
        found = [b for b in my_bookings_res.json() if b["id"] == booking_id]
        assert len(found) == 1
        assert found[0]["can_cancel"] is False
        assert found[0]["is_past"] is True

        # 2. Attempt to cancel past booking -> must fail with HTTP 400
        cancel_res = client.post(
            f"/api/bookings/{booking_id}/cancel",
            json={"reason": "Cannot attend"},
            headers=headers
        )
        assert cancel_res.status_code == 400
        assert "Cannot cancel a booking whose scheduled time has already commenced or passed" in cancel_res.json()["detail"]

    finally:
        if booking_id:
            b = db.query(Booking).filter(Booking.id == booking_id).first()
            if b:
                db.delete(b)
                db.commit()
        db.close()


def test_expired_open_matches_removed_from_slot_booking():
    db = SessionLocal()
    match_id = None
    try:
        owner = db.query(User).filter(User.email == "owner.kochi@playsport.com").first()
        customer = db.query(User).filter(User.email == "rahul.kumar@example.com").first()
        assert owner is not None and customer is not None

        # Create an expired open match
        expired_match = OpenMatch(
            creator_id=owner.id,
            turf_id=1,
            ground_id=1,
            title="Expired Yesterday Match",
            sport_type="Football (5v5)",
            skill_level="Casual",
            match_date="2020-05-10",
            start_time="08:00 AM",
            end_time="09:00 AM",
            max_players=10,
            current_players=1,
            price_per_player=150.0,
            status=MatchStatusEnum.OPEN
        )
        db.add(expired_match)
        db.commit()
        db.refresh(expired_match)
        match_id = expired_match.id

        # 1. Fetch open matches without include_past -> expired match must NOT appear
        res_active = client.get("/api/open-matches/")
        assert res_active.status_code == 200
        match_ids = [m["id"] for m in res_active.json()]
        assert match_id not in match_ids

        # 2. Check that it was auto-transitioned to COMPLETED
        db.refresh(expired_match)
        assert expired_match.status == MatchStatusEnum.COMPLETED

        # 3. Attempt to join expired match -> must fail with HTTP 400
        login_res = client.post("/api/auth/login", json={
            "email": "rahul.kumar@example.com",
            "password": "Customer@123"
        })
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        join_res = client.post(f"/api/open-matches/{match_id}/join", headers=headers)
        assert join_res.status_code == 400
        assert "Match is no longer active" in join_res.json()["detail"] or "Time is up" in join_res.json()["detail"]

    finally:
        if match_id:
            m = db.query(OpenMatch).filter(OpenMatch.id == match_id).first()
            if m:
                db.delete(m)
                db.commit()
        db.close()
