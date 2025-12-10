import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, List, Optional

from config import settings

# For local development, use SQLite file
DB_PATH = Path(__file__).parent / "showtracker.db"


def get_db_path() -> str:
    """Return the database path (for local SQLite usage)."""
    return str(DB_PATH)


@contextmanager
def get_connection():
    """Context manager for database connections."""
    conn = sqlite3.connect(get_db_path())
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def execute_query(query: str, params: tuple = ()) -> List[sqlite3.Row]:
    """Execute a SELECT query and return rows."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        return cursor.fetchall()


def execute_write(query: str, params: tuple = ()) -> int:
    """Execute an INSERT/UPDATE/DELETE and return lastrowid or rowcount."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        conn.commit()
        return cursor.lastrowid if cursor.lastrowid else cursor.rowcount


def execute_many(query: str, params_list: List[tuple]) -> int:
    """Execute multiple writes in a batch."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.executemany(query, params_list)
        conn.commit()
        return cursor.rowcount


def row_to_dict(row: Optional[sqlite3.Row]) -> Optional[dict]:
    """Convert a sqlite3.Row to a dictionary."""
    if row is None:
        return None
    return dict(row)


def rows_to_dicts(rows: List[sqlite3.Row]) -> List[dict]:
    """Convert a list of sqlite3.Row to list of dicts."""
    return [dict(r) for r in rows]


def init_db():
    """Initialize the database schema from schema.sql."""
    schema_path = Path(__file__).parent / "schema.sql"
    if not schema_path.exists():
        raise FileNotFoundError(f"Schema file not found: {schema_path}")

    with get_connection() as conn:
        with open(schema_path, "r") as f:
            conn.executescript(f.read())
        conn.commit()
