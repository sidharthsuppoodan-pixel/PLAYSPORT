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

