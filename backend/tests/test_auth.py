"""Tests for authentication endpoints."""

import pytest


def test_login_returns_google_url(client):
    """Test that login endpoint returns a Google OAuth URL."""
    response = client.get("/api/auth/login")
    assert response.status_code == 200
    data = response.json()
    assert "url" in data
    assert "accounts.google.com" in data["url"]
    assert "client_id" in data["url"]


def test_login_redirect(client):
    """Test that login/redirect redirects to Google."""
    response = client.get("/api/auth/login/redirect", follow_redirects=False)
    assert response.status_code == 307
    assert "accounts.google.com" in response.headers["location"]


def test_callback_without_code_fails(client):
    """Test that callback fails without authorization code."""
    response = client.get("/api/auth/callback")
    assert response.status_code == 422  # Missing required parameter


def test_jwt_token_creation():
    """Test JWT token creation and verification."""
    from auth.jwt_handler import create_access_token, verify_token
    
    user_id = "test-user-123"
    token = create_access_token(user_id)
    
    assert token is not None
    assert len(token) > 0
    
    # Verify the token
    payload = verify_token(token)
    assert payload["user_id"] == user_id
    assert "exp" in payload
    assert "iat" in payload


def test_jwt_token_with_extra_data():
    """Test JWT token with additional payload data."""
    from auth.jwt_handler import create_access_token, verify_token
    
    user_id = "test-user-456"
    extra = {"email": "test@example.com", "role": "user"}
    token = create_access_token(user_id, extra_data=extra)
    
    payload = verify_token(token)
    assert payload["user_id"] == user_id
    assert payload["email"] == "test@example.com"
    assert payload["role"] == "user"


def test_invalid_jwt_token_fails():
    """Test that invalid JWT tokens are rejected."""
    from auth.jwt_handler import verify_token
    from fastapi import HTTPException
    
    with pytest.raises(HTTPException) as exc_info:
        verify_token("invalid-token")
    
    assert exc_info.value.status_code == 401
