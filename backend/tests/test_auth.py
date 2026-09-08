import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_health():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "Online"

def test_admin_login():
    response = client.post("/api/auth/admin-login", json={
        "email": "admin@playsport.com",
        "password": "Admin@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["full_name"] == "ALEX ADMIN"

def test_customer_login():
    response = client.post("/api/auth/login", json={
        "email": "arjun.nair@example.com",
        "password": "Customer@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "CUSTOMER"

def test_invalid_login():
    response = client.post("/api/auth/login", json={
        "email": "arjun.nair@example.com",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_customer_registration():
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

