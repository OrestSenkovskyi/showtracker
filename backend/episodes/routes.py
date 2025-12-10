from typing import List
from fastapi import APIRouter, HTTPException, Depends, Body

from schemas import (
    EpisodeWatchedCreate,
    MarkEpisodesRequest,
    ShowProgress,
    UserProgressResponse,
)
from auth.jwt_handler import get_current_user_id
from episodes.models import (
    mark_episode_watched,
    mark_episodes_watched_batch,
    unmark_episode_watched,
    get_watched_episodes,
    calculate_progress,
    get_user_progress_all_shows,
    mark_season_watched,
)

router = APIRouter()


@router.post("/mark-watched")
async def mark_watched(
    body: EpisodeWatchedCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Mark a single episode as watched."""
    episode_id = mark_episode_watched(
        user_id=user_id,
        show_id=body.show_id,
        season=body.season,
        episode=body.episode,
    )
    return {"id": episode_id, "message": "Episode marked as watched"}


@router.post("/mark-watched/batch")
async def mark_watched_batch(
    body: MarkEpisodesRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Mark multiple episodes as watched at once."""
    episodes = [(ep.season, ep.episode) for ep in body.episodes]
    count = mark_episodes_watched_batch(
        user_id=user_id,
        show_id=body.show_id,
        episodes=episodes,
    )
    return {"marked_count": count, "message": f"{count} episodes marked as watched"}


@router.post("/mark-season-watched")
async def mark_season_as_watched(
    show_id: int = Body(...),
    season: int = Body(...),
    episode_count: int = Body(...),
    user_id: str = Depends(get_current_user_id),
):
    """Mark all episodes in a season as watched."""
    count = mark_season_watched(
        user_id=user_id,
        show_id=show_id,
        season=season,
        episode_count=episode_count,
    )
    return {"marked_count": count, "message": f"Season {season} marked as watched"}


@router.delete("/unmark-watched")
async def unmark_watched(
    body: EpisodeWatchedCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Unmark an episode as watched."""
    success = unmark_episode_watched(
        user_id=user_id,
        show_id=body.show_id,
        season=body.season,
        episode=body.episode,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Episode not marked as watched")
    return {"message": "Episode unmarked"}


@router.get("/show/{show_id}")
async def get_show_watched_episodes(
    show_id: int,
    user_id: str = Depends(get_current_user_id),
):
    """Get all watched episodes for a specific show."""
    episodes = get_watched_episodes(user_id, show_id)
    return {"show_id": show_id, "episodes": episodes}


@router.get("/show/{show_id}/progress")
async def get_show_progress(
    show_id: int,
    user_id: str = Depends(get_current_user_id),
):
    """Get watching progress for a specific show."""
    progress = calculate_progress(user_id, show_id)
    return {"show_id": show_id, **progress}


@router.get("/progress", response_model=UserProgressResponse)
async def get_all_progress(user_id: str = Depends(get_current_user_id)):
    """Get progress for all shows the user is tracking."""
    progress_list = get_user_progress_all_shows(user_id)
    shows = [
        ShowProgress(
            show_id=p["show_id"],
            title=p["title"],
            total_episodes=p["total_episodes"],
            watched_episodes=p["watched_episodes"],
            percentage=p["percentage"],
            status=p["status"],
        )
        for p in progress_list
    ]
    return UserProgressResponse(shows=shows)
