def test_get_empty_turfs(client):
    """Test getting turfs when none exist in the test DB."""
    response = client.get("/api/turfs")
    assert response.status_code == 200
    assert response.json() == []

def test_create_turf(client, test_admin):
    """Test creating a turf using the admin token."""
    payload = {
        "name": "Super Test Turf",
        "description": "A very professional turf.",
        "address": "Test Avenue 1",
        "city": "Ernakulam",
        "state": "Kerala",
        "pincode": "682001",
        "contact_phone": "9999999999",
        "contact_email": "turf@example.com",
        "starting_price": 1000.0,
        "sports_supported": "Football, Cricket"
    }
    
    response = client.post("/api/turfs", json=payload, headers=test_admin)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Super Test Turf"
    assert data["slug"] == "super-test-turf"
    assert "id" in data

def test_get_all_turfs(client, test_admin):
    """Test getting a list of turfs after creating one."""
    # Create one first
    payload = {
        "name": "Another Turf",
        "city": "Kozhikode",
        "address": "Sample Address"
    }
    client.post("/api/turfs", json=payload, headers=test_admin)
    
    response = client.get("/api/turfs")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any(turf["name"] == "Another Turf" for turf in data)
