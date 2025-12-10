"""Tests for database functions."""

import pytest


def test_database_init(temp_db):
    """Test that database initializes with correct tables."""
    from database import execute_query
    
    # Check tables exist
    tables = execute_query(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )
    table_names = [t["name"] for t in tables]
    
    assert "users" in table_names
    assert "shows" in table_names
    assert "user_shows" in table_names
    assert "episodes_watched" in table_names


def test_execute_query(temp_db):
    """Test execute_query returns results."""
    from database import execute_query
    
    # Query should work on empty table
    results = execute_query("SELECT * FROM users")
    assert isinstance(results, list)
    assert len(results) == 0


def test_execute_write(temp_db):
    """Test execute_write inserts data."""
    from database import execute_write, execute_query
    
    # Insert a user
    execute_write(
        "INSERT INTO users (id, google_id, email) VALUES (?, ?, ?)",
        ("user-1", "google-1", "test@test.com"),
    )
    
    # Verify
    results = execute_query("SELECT * FROM users WHERE id = ?", ("user-1",))
    assert len(results) == 1
    assert results[0]["email"] == "test@test.com"


def test_row_to_dict(temp_db):
    """Test row_to_dict conversion."""
    from database import execute_query, execute_write, row_to_dict
    
    execute_write(
        "INSERT INTO users (id, google_id, email, name) VALUES (?, ?, ?, ?)",
        ("user-2", "google-2", "dict@test.com", "Dict User"),
    )
    
    rows = execute_query("SELECT * FROM users WHERE id = ?", ("user-2",))
    user_dict = row_to_dict(rows[0])
    
    assert isinstance(user_dict, dict)
    assert user_dict["id"] == "user-2"
    assert user_dict["email"] == "dict@test.com"
    assert user_dict["name"] == "Dict User"


def test_row_to_dict_none():
    """Test row_to_dict handles None."""
    from database import row_to_dict
    
    result = row_to_dict(None)
    assert result is None


def test_rows_to_dicts(temp_db):
    """Test rows_to_dicts conversion."""
    from database import execute_query, execute_write, rows_to_dicts
    
    # Insert multiple users
    for i in range(3):
        execute_write(
            "INSERT INTO users (id, google_id, email) VALUES (?, ?, ?)",
            (f"user-{i}", f"google-{i}", f"user{i}@test.com"),
        )
    
    rows = execute_query("SELECT * FROM users ORDER BY id")
    dicts = rows_to_dicts(rows)
    
    assert isinstance(dicts, list)
    assert len(dicts) == 3
    assert all(isinstance(d, dict) for d in dicts)
