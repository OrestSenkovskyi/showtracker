import os
import sys
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set test environment variables before importing app
os.environ["GOOGLE_CLIENT_ID"] = "test-client-id"
os.environ["GOOGLE_CLIENT_SECRET"] = "test-client-secret"
os.environ["TMDB_API_KEY"] = "test-tmdb-key"
os.environ["JWT_SECRET"] = "test-jwt-secret-for-testing-only"


@pytest.fixture(scope="function")
def temp_db():
    """Create a temporary database for testing."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    
    # Override the database path
    import database
    original_path = database.DB_PATH
    database.DB_PATH = Path(db_path)
    
    # Initialize the database
    database.init_db()
    
    yield db_path
    
    # Cleanup
    database.DB_PATH = original_path
    try:
        os.unlink(db_path)
    except OSError:
        pass


@pytest.fixture(scope="function")
def client(temp_db):
    """Create a test client with a fresh database."""
    from main import app
    
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def test_user(temp_db):
    """Create a test user in the database."""
    import uuid
    from database import execute_write
    
    user_id = str(uuid.uuid4())
    execute_write(
        """
        INSERT INTO users (id, google_id, email, name, picture_url)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_id, "google-123", "test@example.com", "Test User", "https://example.com/pic.jpg"),
    )
    return {"id": user_id, "email": "test@example.com", "name": "Test User"}


@pytest.fixture
def auth_token(test_user):
    """Create a valid JWT token for testing."""
    from auth.jwt_handler import create_access_token
    
    return create_access_token(test_user["id"])


@pytest.fixture
def auth_headers(auth_token):
    """Return headers with authorization token."""
    return {"Authorization": f"Bearer {auth_token}"}
