from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ─────────────────────────────────────────────────────────────
# User schemas
# ─────────────────────────────────────────────────────────────
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None
    picture_url: Optional[str] = None


class UserCreate(UserBase):
    google_id: str


class User(UserBase):
    id: str
    google_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Show schemas
# ─────────────────────────────────────────────────────────────
class ShowBase(BaseModel):
    id: int  # TMDb ID
    title: str
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    first_air_date: Optional[str] = None
    total_episodes: Optional[int] = None
    total_seasons: Optional[int] = None
    genres: Optional[str] = None  # comma-separated
    tmdb_rating: Optional[float] = None


class Show(ShowBase):
    cached_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ShowSearchResult(BaseModel):
    id: int
    name: str
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    first_air_date: Optional[str] = None
    vote_average: Optional[float] = None


class ShowSearchResponse(BaseModel):
    results: List[ShowSearchResult]
    page: int
    total_pages: int
    total_results: int


# ─────────────────────────────────────────────────────────────
# User-Show tracking schemas
# ─────────────────────────────────────────────────────────────
class UserShowBase(BaseModel):
    show_id: int
    status: str = "watching"  # watching, completed, dropped, paused
    favorite: bool = False


class UserShowCreate(UserShowBase):
    pass


class UserShow(UserShowBase):
    id: str
    user_id: str
    added_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Episode schemas
# ─────────────────────────────────────────────────────────────
class EpisodeWatchedBase(BaseModel):
    show_id: int
    season: int
    episode: int


class EpisodeWatchedCreate(EpisodeWatchedBase):
    pass


class EpisodeWatched(EpisodeWatchedBase):
    id: str
    user_id: str
    watched_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MarkEpisodesRequest(BaseModel):
    show_id: int
    episodes: List[EpisodeWatchedBase]  # list of season/episode pairs


class ShowProgress(BaseModel):
    show_id: int
    title: str
    total_episodes: int
    watched_episodes: int
    percentage: float
    status: str


class UserProgressResponse(BaseModel):
    shows: List[ShowProgress]


# ─────────────────────────────────────────────────────────────
# Auth schemas
# ─────────────────────────────────────────────────────────────
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoogleAuthUrl(BaseModel):
    url: str
