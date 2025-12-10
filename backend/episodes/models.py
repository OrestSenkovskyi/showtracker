import uuid
from typing import List, Dict, Any, Optional, Set, Tuple

from database import execute_query, execute_write, execute_many, rows_to_dicts, row_to_dict


def mark_episode_watched(
    user_id: str,
    show_id: int,
    season: int,
    episode: int,
) -> str:
    """
    Mark a single episode as watched.
    Returns the episode_watched id.
    """
    episode_id = str(uuid.uuid4())
    execute_write(
        """
        INSERT OR IGNORE INTO episodes_watched (id, user_id, show_id, season, episode)
        VALUES (?, ?, ?, ?, ?)
        """,
        (episode_id, user_id, show_id, season, episode),
    )
    return episode_id


def mark_episodes_watched_batch(
    user_id: str,
    show_id: int,
    episodes: List[Tuple[int, int]],  # list of (season, episode) tuples
) -> int:
    """
    Mark multiple episodes as watched in a batch.
    Returns count of newly marked episodes.
    """
    params_list = [
        (str(uuid.uuid4()), user_id, show_id, season, episode)
        for season, episode in episodes
    ]
    return execute_many(
        """
        INSERT OR IGNORE INTO episodes_watched (id, user_id, show_id, season, episode)
        VALUES (?, ?, ?, ?, ?)
        """,
        params_list,
    )


def unmark_episode_watched(
    user_id: str,
    show_id: int,
    season: int,
    episode: int,
) -> bool:
    """
    Unmark an episode as watched.
    Returns True if an episode was removed.
    """
    result = execute_write(
        """
        DELETE FROM episodes_watched
        WHERE user_id = ? AND show_id = ? AND season = ? AND episode = ?
        """,
        (user_id, show_id, season, episode),
    )
    return result > 0


def get_watched_episodes(user_id: str, show_id: int) -> List[Dict[str, Any]]:
    """Get all watched episodes for a user's show."""
    rows = execute_query(
        """
        SELECT * FROM episodes_watched
        WHERE user_id = ? AND show_id = ?
        ORDER BY season, episode
        """,
        (user_id, show_id),
    )
    return rows_to_dicts(rows)


def get_watched_episodes_set(user_id: str, show_id: int) -> Set[Tuple[int, int]]:
    """
    Get watched episodes as a set of (season, episode) tuples.
    Useful for quick lookups.
    """
    rows = execute_query(
        """
        SELECT season, episode FROM episodes_watched
        WHERE user_id = ? AND show_id = ?
        """,
        (user_id, show_id),
    )
    return {(r["season"], r["episode"]) for r in rows}


def get_watched_count(user_id: str, show_id: int) -> int:
    """Get the count of watched episodes for a show."""
    rows = execute_query(
        """
        SELECT COUNT(*) as count FROM episodes_watched
        WHERE user_id = ? AND show_id = ?
        """,
        (user_id, show_id),
    )
    return rows[0]["count"] if rows else 0


def calculate_progress(
    user_id: str,
    show_id: int,
    total_episodes: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Calculate watching progress for a show.
    Returns dict with watched count, total, and percentage.
    """
    watched_count = get_watched_count(user_id, show_id)

    # If total_episodes not provided, try to get from shows table
    if total_episodes is None:
        rows = execute_query(
            "SELECT total_episodes FROM shows WHERE id = ?",
            (show_id,),
        )
        total_episodes = rows[0]["total_episodes"] if rows else 0

    total_episodes = total_episodes or 0
    percentage = (watched_count / total_episodes * 100) if total_episodes > 0 else 0

    return {
        "watched": watched_count,
        "total": total_episodes,
        "percentage": round(percentage, 1),
    }


def get_user_progress_all_shows(user_id: str) -> List[Dict[str, Any]]:
    """
    Get progress for all shows a user is tracking.
    Returns list of shows with their progress info.
    """
    rows = execute_query(
        """
        SELECT
            us.show_id,
            us.status,
            us.favorite,
            s.title,
            s.poster_path,
            s.total_episodes,
            (SELECT COUNT(*) FROM episodes_watched ew
             WHERE ew.user_id = us.user_id AND ew.show_id = us.show_id) as watched_count
        FROM user_shows us
        JOIN shows s ON us.show_id = s.id
        WHERE us.user_id = ?
        ORDER BY us.added_at DESC
        """,
        (user_id,),
    )

    result = []
    for row in rows:
        r = dict(row)
        total = r.get("total_episodes") or 0
        watched = r.get("watched_count") or 0
        percentage = (watched / total * 100) if total > 0 else 0
        result.append({
            "show_id": r["show_id"],
            "title": r["title"],
            "poster_path": r["poster_path"],
            "status": r["status"],
            "favorite": bool(r["favorite"]),
            "total_episodes": total,
            "watched_episodes": watched,
            "percentage": round(percentage, 1),
        })

    return result


def mark_season_watched(
    user_id: str,
    show_id: int,
    season: int,
    episode_count: int,
) -> int:
    """
    Mark all episodes in a season as watched.
    Returns count of newly marked episodes.
    """
    episodes = [(season, ep) for ep in range(1, episode_count + 1)]
    return mark_episodes_watched_batch(user_id, show_id, episodes)
