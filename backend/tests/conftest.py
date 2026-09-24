"""
Pytest fixtures for API integration tests.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app

# Use an in-memory SQLite database for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_patients.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test, drop after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client():
    """Provide a test client with the DB dependency overridden."""
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def sample_patient_data():
    """Return a valid patient creation payload."""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-05-15",
        "sex": "Male",
        "phone_number": "2125551234",
        "address_line_1": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zip_code": "10001",
        "email": "john.doe@example.com",
    }
