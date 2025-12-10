-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shows (cached from TMDb)
CREATE TABLE IF NOT EXISTS shows (
    id INTEGER PRIMARY KEY,  -- TMDb ID
    title TEXT NOT NULL,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    first_air_date TEXT,
    total_episodes INTEGER,
    total_seasons INTEGER,
    genres TEXT,  -- JSON string: "Drama,Thriller"
    tmdb_rating REAL,
    external_ids TEXT,  -- JSON: {imdb_id, etc}
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User's shows (tracking)
CREATE TABLE IF NOT EXISTS user_shows (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    show_id INTEGER NOT NULL,
    status TEXT DEFAULT 'watching',  -- watching, completed, dropped, paused
    favorite BOOLEAN DEFAULT 0,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, show_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(show_id) REFERENCES shows(id)
);

-- Episodes watched
CREATE TABLE IF NOT EXISTS episodes_watched (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    show_id INTEGER NOT NULL,
    season INTEGER NOT NULL,
    episode INTEGER NOT NULL,
    watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, show_id, season, episode),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(show_id) REFERENCES shows(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_shows_user_id ON user_shows(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_user ON episodes_watched(user_id, show_id);
CREATE INDEX IF NOT EXISTS idx_shows_title ON shows(title);
