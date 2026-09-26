import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import Base, get_db

# Import all models so metadata knows about them
from app.models.user import User
from app.models.turf import Turf
from app.models.ground import Ground
from app.models.booking import Booking
from app.models.review import Review
from app.models.open_match import OpenMatch
from app.models.tournament import Tournament
from app.models.equipment import Equipment
from app.models.payment import Payment
from app.core.security import get_password_hash

from sqlalchemy.pool import StaticPool

# Use in-memory SQLite for extremely fast, isolated tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for every test function."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    """Override FastAPI dependency to use the test database."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_admin(db_session):
    """Create a test admin user and return their token headers."""
    admin = User(
        email="testadmin@example.com",
        username="testadmin",
        hashed_password=get_password_hash("AdminPass123!"),
        role="ADMIN",
        full_name="Test Admin"
    )
    db_session.add(admin)
    db_session.commit()
    
    # We could hit the login endpoint, or we can just mock a token creation
    # For integration testing, it's best to hit the endpoint
    from app.core.security import create_access_token
    token = create_access_token({"sub": str(admin.id), "role": admin.role})
    return {"Authorization": f"Bearer {token}"}
