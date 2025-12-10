import json
from typing import Optional, Dict, Any
from datetime import datetime

from database import execute_query, execute_write, row_to_dict, rows_to_dicts


def cache_show_from_tmdb(tmdb_data: Dict[str, Any]) -> int:
    """
    Cache a show from TMDb API response into local database.
    Returns the show_id.
    """
    show_id = tmdb_data["id"]
    title = tmdb_data.get("name") or tmdb_data.get("title", "Unknown")
    overview = tmdb_data.get("overview", "")
    poster_path = tmdb_data.get("poster_path")
    backdrop_path = tmdb_data.get("backdrop_path")
    first_air_date = tmdb_data.get("first_air_date")

    # Handle total episodes/seasons
    total_episodes = tmdb_data.get("number_of_episodes")
    total_seasons = tmdb_data.get("number_of_seasons")

    # Handle genres (can be list of dicts or string)
    genres_raw = tmdb_data.get("genres", [])
    if isinstance(genres_raw, list) and genres_raw:
        if isinstance(genres_raw[0], dict):
            genres = ",".join(g.get("name", "") for g in genres_raw)
        else:
            genres = ",".join(str(g) for g in genres_raw)
    else:
        genres = ""

    tmdb_rating = tmdb_data.get("vote_average")

    # Check if show already cached
    existing = execute_query("SELECT id FROM shows WHERE id = ?", (show_id,))
    if existing:
        # Update existing cache
        execute_write(
            """
            UPDATE shows
            SET title = ?, overview = ?, poster_path = ?, backdrop_path = ?,
                first_air_date = ?, total_episodes = ?, total_seasons = ?,
                genres = ?, tmdb_rating = ?, cached_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                title,
                overview,
                poster_path,
                backdrop_path,
                first_air_date,
                total_episodes,
                total_seasons,
                genres,
                tmdb_rating,
                show_id,
            ),
        )
    else:
        # Insert new show
        execute_write(
            """
            INSERT INTO shows
            (id, title, overview, poster_path, backdrop_path, first_air_date,
             total_episodes, total_seasons, genres, tmdb_rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                show_id,
                title,
                overview,
                poster_path,
                backdrop_path,
                first_air_date,
                total_episodes,
                total_seasons,
                genres,
                tmdb_rating,
            ),
        )

    return show_id


def get_cached_show(show_id: int) -> Optional[Dict[str, Any]]:
    """Get a show from local cache by ID."""
    rows = execute_query("SELECT * FROM shows WHERE id = ?", (show_id,))
    return row_to_dict(rows[0]) if rows else None


def is_cache_stale(cached_at: str, max_age_days: int = 7) -> bool:
    """Check if cached data is older than max_age_days."""
    if not cached_at:
        return True
    try:
        cached_time = datetime.fromisoformat(cached_at.replace("Z", "+00:00"))
        age = datetime.now() - cached_time.replace(tzinfo=None)
        return age.days > max_age_days
    except (ValueError, TypeError):
        return True


def get_user_shows(user_id: str) -> list:
    """Get all shows a user is tracking."""
    rows = execute_query(
        """
        SELECT us.*, s.title, s.poster_path, s.total_episodes, s.total_seasons, s.tmdb_rating
        FROM user_shows us
        JOIN shows s ON us.show_id = s.id
        WHERE us.user_id = ?
        ORDER BY us.added_at DESC
        """,
        (user_id,),
    )
    return rows_to_dicts(rows)


def add_show_to_user(
    user_id: str,
    show_id: int,
    status: str = "watching",
    favorite: bool = False,
) -> str:
    """
    Add a show to user's tracking list.
    Returns the user_show id.
    """
    import uuid

    user_show_id = str(uuid.uuid4())
    execute_write(
        """
        INSERT OR REPLACE INTO user_shows (id, user_id, show_id, status, favorite)
        VALUES (?, ?, ?, ?, ?)
        """,
        (user_show_id, user_id, show_id, status, favorite),
    )
    return user_show_id


def update_user_show_status(user_id: str, show_id: int, status: str) -> bool:
    """Update the status of a user's show."""
    result = execute_write(
        """
        UPDATE user_shows
        SET status = ?
        WHERE user_id = ? AND show_id = ?
        """,
        (status, user_id, show_id),
    )
    return result > 0


def remove_show_from_user(user_id: str, show_id: int) -> bool:
    """Remove a show from user's tracking list."""
    result = execute_write(
        """
        DELETE FROM user_shows
        WHERE user_id = ? AND show_id = ?
        """,
        (user_id, show_id),
    )
    return result > 0
