"""Tests for episodes endpoints."""

import pytest


def test_mark_watched_requires_auth(client):
    """Test that marking an episode watched requires authentication."""
    response = client.post(
        "/api/episodes/mark-watched",
        json={"show_id": 1399, "season": 1, "episode": 1},
    )
    assert response.status_code == 403


def test_get_progress_requires_auth(client):
    """Test that getting progress requires authentication."""
    response = client.get("/api/episodes/progress")
    assert response.status_code == 403


def test_get_progress_with_auth(client, auth_headers, test_user):
    """Test getting progress with authentication."""
    response = client.get("/api/episodes/progress", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "shows" in data
    assert isinstance(data["shows"], list)


def test_get_show_watched_episodes_requires_auth(client):
    """Test that getting watched episodes requires authentication."""
    response = client.get("/api/episodes/show/1399")
    assert response.status_code == 403


def test_get_show_watched_episodes_with_auth(client, auth_headers, test_user):
    """Test getting watched episodes with authentication."""
    response = client.get("/api/episodes/show/1399", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["show_id"] == 1399
    assert "episodes" in data


def test_episode_models_mark_watched(temp_db, test_user):
    """Test the mark_episode_watched function."""
    from episodes.models import mark_episode_watched, get_watched_count
    
    # Mark an episode as watched
    episode_id = mark_episode_watched(
        user_id=test_user["id"],
        show_id=1399,
        season=1,
        episode=1,
    )
    
    assert episode_id is not None
    
    # Check the count
    count = get_watched_count(test_user["id"], 1399)
    assert count == 1


def test_episode_models_mark_multiple(temp_db, test_user):
    """Test marking multiple episodes."""
    from episodes.models import mark_episodes_watched_batch, get_watched_count
    
    # Mark several episodes
    episodes = [(1, 1), (1, 2), (1, 3)]
    count = mark_episodes_watched_batch(
        user_id=test_user["id"],
        show_id=1399,
        episodes=episodes,
    )
    
    assert count == 3
    
    # Check the total
    total = get_watched_count(test_user["id"], 1399)
    assert total == 3


def test_episode_models_calculate_progress(temp_db, test_user):
    """Test progress calculation."""
    from episodes.models import mark_episode_watched, calculate_progress
    from shows.models import cache_show_from_tmdb
    
    # Cache a show with known episode count
    cache_show_from_tmdb({
        "id": 1399,
        "name": "Game of Thrones",
        "number_of_episodes": 10,
        "number_of_seasons": 1,
    })
    
    # Mark 3 episodes
    for ep in range(1, 4):
        mark_episode_watched(test_user["id"], 1399, 1, ep)
    
    # Calculate progress
    progress = calculate_progress(test_user["id"], 1399)
    
    assert progress["watched"] == 3
    assert progress["total"] == 10
    assert progress["percentage"] == 30.0
