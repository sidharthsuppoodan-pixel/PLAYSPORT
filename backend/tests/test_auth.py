import pytest
from fastapi.testclient import TestClient
from app.main import app

# Remove module-level client to use pytest fixture
def test_root_health(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "Online"

def test_admin_login(client, db_session):
    # Setup admin in test DB
    from app.models.user import User
    from app.core.security import get_password_hash
    db_session.add(User(email="admin@playsport.com", username="admin", hashed_password=get_password_hash("Admin@123"), role="ADMIN", full_name="ALEX ADMIN"))
    db_session.commit()
    
    response = client.post("/api/auth/admin-login", json={
        "email": "admin@playsport.com",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["full_name"] == "ALEX ADMIN"

def test_customer_login(client, db_session):
    from app.models.user import User
    from app.core.security import get_password_hash
    db_session.add(User(email="arjun.nair@example.com", username="arjun", hashed_password=get_password_hash("Customer@123"), role="CUSTOMER", full_name="Arjun"))
    db_session.commit()
    
    response = client.post("/api/auth/login", json={
        "email": "arjun.nair@example.com",
        "password": "Customer@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "CUSTOMER"

def test_invalid_login(client):
    response = client.post("/api/auth/login", json={
        "email": "arjun.nair@example.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_customer_registration(client):
    import uuid
    rand = uuid.uuid4().hex[:6]
    response = client.post("/api/auth/register", json={
        "email": f"testuser_{rand}@example.com",
        "username": f"testuser_{rand}",
        "full_name": "Test Athlete",
        "phone": "9876500000",
        "password": "SecurePassword123!"
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["username"] == f"testuser_{rand}"
    assert data["user"]["full_name"] == "TEST ATHLETE"


def test_registration_phone_validation(client):
    import uuid
    rand = uuid.uuid4().hex[:6]
    base_payload = {
        "email": f"phone_val_{rand}@example.com",
        "username": f"phone_val_{rand}",
        "full_name": "Athlete Phone Test",
        "password": "SecurePassword123!"
    }

    # 1. Reject missing phone
    res_missing = client.post("/api/auth/register", json=base_payload)
    assert res_missing.status_code == 422

    # 2. Reject short phone (less than 10 digits)
    res_short = client.post("/api/auth/register", json={**base_payload, "phone": "98765"})
    assert res_short.status_code == 422

    # 3. Reject non-Indian mobile prefix (e.g. starts with 5)
    res_prefix = client.post("/api/auth/register", json={**base_payload, "phone": "5987654321"})
    assert res_prefix.status_code == 422

    # 4. Reject all identical digits (e.g. 9999999999)
    res_all_same = client.post("/api/auth/register", json={**base_payload, "phone": "9999999999"})
    assert res_all_same.status_code == 422

    # 5. Reject if first 7 digits are identical (e.g. 9999999123)
    res_7same = client.post("/api/auth/register", json={**base_payload, "phone": "9999999123"})
    assert res_7same.status_code == 422

    # 6. Reject if any digit repeats more than 6 times consecutively (e.g. 9888888812)
    res_rep = client.post("/api/auth/register", json={**base_payload, "phone": "9888888812"})
    assert res_rep.status_code == 422

    # 7. Accept when first 6 digits are identical (e.g. 9999991234)
    res_6same = client.post("/api/auth/register", json={
        "email": f"phone_6same_{rand}@example.com",
        "username": f"phone_6same_{rand}",
        "full_name": "Six Same Digits Athlete",
        "phone": "9999991234",
        "password": "SecurePassword123!"
    })
    assert res_6same.status_code == 201
    assert res_6same.json()["user"]["phone"] == "9999991234"

    # 8. Turf owner registration: reject 7 identical first digits
    res_owner_invalid = client.post("/api/auth/register-owner", json={
        "email": f"owner_rep_{rand}@example.com",
        "username": f"owner_rep_{rand}",
        "full_name": "Turf Owner Rep",
        "phone": "8888888123",
        "business_name": "Repetitive Arena",
        "city": "Kochi",
        "password": "SecurePassword123!"
    })
    assert res_owner_invalid.status_code == 422

    # 9. Turf owner registration: accept valid Indian mobile
    res_owner_valid = client.post("/api/auth/register-owner", json={
        "email": f"owner_ok_{rand}@example.com",
        "username": f"owner_ok_{rand}",
        "full_name": "Turf Owner Valid",
        "phone": "9847123456",
        "business_name": "Valid Arena Kochi",
        "city": "Kochi",
        "password": "SecurePassword123!"
    })
    assert res_owner_valid.status_code == 201


