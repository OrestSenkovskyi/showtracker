"""Tests for shows endpoints."""

import pytest
from unittest.mock import AsyncMock, patch


def test_search_shows_requires_query(client):
    """Test that search requires a query parameter."""
    response = client.get("/api/shows/search")
    assert response.status_code == 422  # Missing required parameter


@patch("shows.routes.tmdb_client.search_shows")
def test_search_shows_returns_results(mock_search, client):
    """Test show search with mocked TMDb response."""
    mock_search.return_value = {
        "results": [
            {
                "id": 1399,
                "name": "Game of Thrones",
                "overview": "Seven noble families fight for control...",
                "poster_path": "/poster.jpg",
                "first_air_date": "2011-04-17",
                "vote_average": 8.4,
            }
        ],
        "page": 1,
        "total_pages": 1,
        "total_results": 1,
    }
    
    response = client.get("/api/shows/search?q=game")
    assert response.status_code == 200
    data = response.json()
    
    assert "results" in data
    assert len(data["results"]) == 1
    assert data["results"][0]["name"] == "Game of Thrones"
    assert data["page"] == 1


def test_get_user_shows_requires_auth(client):
    """Test that getting user shows requires authentication."""
    response = client.get("/api/shows/user/list")
    assert response.status_code == 403  # No auth header


def test_get_user_shows_with_auth(client, auth_headers, test_user):
    """Test getting user shows with authentication."""
    response = client.get("/api/shows/user/list", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "shows" in data
    assert isinstance(data["shows"], list)


def test_add_show_requires_auth(client):
    """Test that adding a show requires authentication."""
    response = client.post(
        "/api/shows/add",
        json={"show_id": 1399, "status": "watching"},
    )
    assert response.status_code == 403


@patch("shows.routes.tmdb_client.get_show_details")
def test_add_show_with_auth(mock_details, client, auth_headers, test_user):
    """Test adding a show with authentication."""
    mock_details.return_value = {
        "id": 1399,
        "name": "Game of Thrones",
        "overview": "Seven noble families...",
        "poster_path": "/poster.jpg",
        "number_of_episodes": 73,
        "number_of_seasons": 8,
        "genres": [{"id": 1, "name": "Drama"}],
        "vote_average": 8.4,
    }
    
    response = client.post(
        "/api/shows/add",
        json={"show_id": 1399, "status": "watching", "favorite": False},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert data["message"] == "Show added to list"


def test_update_show_status_requires_auth(client):
    """Test that updating show status requires authentication."""
    response = client.patch("/api/shows/1399/status?status=completed")
    assert response.status_code == 403


def test_delete_show_requires_auth(client):
    """Test that deleting a show requires authentication."""
    response = client.delete("/api/shows/1399")
    assert response.status_code == 403
