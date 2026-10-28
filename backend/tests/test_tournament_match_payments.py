import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.tournament import Tournament, TournamentStatusEnum
from app.models.open_match import OpenMatch, MatchStatusEnum
from app.models.turf import Turf
from app.models.ground import Ground
from app.models.user import User
from app.services.razorpay_service import razorpay_service

client = TestClient(app)

def get_player_token():
    # Use unique or existing player
    login_res = client.post("/api/auth/login", json={
        "email": "player@playsport.com",
        "password": "Customer@123"
    })
    if login_res.status_code == 200:
        return login_res.json()["access_token"]
    
    # Or signup a fresh test user
    test_email = f"test_{uuid.uuid4().hex[:6]}@playsport.com"
    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "Customer@123",
        "full_name": "Test Player",
        "phone": "9876543210",
        "role": "PLAYER"
    })
    return reg_res.json()["access_token"]


def test_tournament_payment_flow():
    db = SessionLocal()
    token = get_player_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure a test tournament exists
    turf = db.query(Turf).first()
    unique_title = f"Championship Cup {uuid.uuid4().hex[:6]}"
    tourn = Tournament(
        turf_id=turf.id,
        creator_id=1,
        title=unique_title,
        sport="Football",
        format="Knockout",
        start_date="2026-12-01",
        end_date="2026-12-05",
        registration_deadline="2026-11-30",
        max_teams=16,
        current_teams=0,
        entry_fee=1500.0,
        prize_pool=20000.0,
        status=TournamentStatusEnum.REGISTRATION_OPEN
    )
    db.add(tourn)
    db.commit()
    db.refresh(tourn)

    # 1. Test validation: invalid phone number (< 10 digits)
    bad_order_res = client.post(
        "/api/payments/razorpay/create-tournament-order",
        json={
            "tournament_id": tourn.id,
            "team_name": f"Strikers {uuid.uuid4().hex[:4]}",
            "captain_name": "John Doe",
            "contact_phone": "12345",
            "members_count": 7
        },
        headers=headers
    )
    assert bad_order_res.status_code in [400, 422]

    # 2. Test valid order creation with strict 10-digit Indian phone (e.g. 9847123456)
    valid_team_name = f"Thunder {uuid.uuid4().hex[:4]}"
    order_res = client.post(
        "/api/payments/razorpay/create-tournament-order",
        json={
            "tournament_id": tourn.id,
            "team_name": valid_team_name,
            "captain_name": "Rajesh Kumar",
            "contact_phone": "9847123456",
            "members_count": 7
        },
        headers=headers
    )
    assert order_res.status_code == 200, order_res.text
    order_data = order_res.json()
    assert "order_id" in order_data
    assert order_data["total_amount_inr"] == 1500.0
    assert order_data["amount"] == 150000  # paise

    # 3. Test verification
    mock_payment_id = f"pay_{uuid.uuid4().hex[:12]}"
    mock_signature = "mock_signature_verified"

    verify_res = client.post(
        "/api/payments/razorpay/verify-tournament-registration",
        json={
            "razorpay_order_id": order_data["order_id"],
            "razorpay_payment_id": mock_payment_id,
            "razorpay_signature": mock_signature,
            "payment_method": "UPI",
            "tournament_id": tourn.id,
            "team_name": valid_team_name,
            "captain_name": "Rajesh Kumar",
            "contact_phone": "9847123456",
            "members_count": 7
        },
        headers=headers
    )
    assert verify_res.status_code == 201, verify_res.text
    verify_data = verify_res.json()
    assert "transaction_id" in verify_data
    assert verify_data["team_name"] == valid_team_name
    assert verify_data["current_teams"] == 1


def test_open_match_payment_flow():
    db = SessionLocal()
    token = get_player_token()
    headers = {"Authorization": f"Bearer {token}"}

    turf = db.query(Turf).first()
    ground = db.query(Ground).filter(Ground.turf_id == turf.id).first()

    unique_match_title = f"Friday Night 5v5 {uuid.uuid4().hex[:6]}"
    match = OpenMatch(
        turf_id=turf.id,
        ground_id=ground.id,
        creator_id=1,
        title=unique_match_title,
        sport_type="Football",
        match_date="2026-11-25",
        start_time="19:00",
        end_time="20:00",
        max_players=10,
        current_players=1,
        price_per_player=250.0,
        status=MatchStatusEnum.OPEN
    )
    db.add(match)
    db.commit()
    db.refresh(match)

    # 1. Create Match Order
    order_res = client.post(
        "/api/payments/razorpay/create-match-order",
        json={"match_id": match.id},
        headers=headers
    )
    assert order_res.status_code == 200, order_res.text
    order_data = order_res.json()
    assert order_data["total_amount_inr"] == 250.0
    assert order_data["amount"] == 25000  # paise

    # 2. Verify Match Join Payment
    mock_payment_id = f"pay_{uuid.uuid4().hex[:12]}"
    mock_signature = "mock_signature_verified"

    verify_res = client.post(
        "/api/payments/razorpay/verify-match-join",
        json={
            "razorpay_order_id": order_data["order_id"],
            "razorpay_payment_id": mock_payment_id,
            "razorpay_signature": mock_signature,
            "payment_method": "UPI",
            "match_id": match.id
        },
        headers=headers
    )
    assert verify_res.status_code == 201, verify_res.text
    verify_data = verify_res.json()
    assert "transaction_id" in verify_data
    assert verify_data["current_players"] == 2
    assert "team_slot" in verify_data
