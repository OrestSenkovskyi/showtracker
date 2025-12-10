from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends

from schemas import ShowSearchResponse, ShowSearchResult, UserShowCreate
from auth.jwt_handler import get_current_user_id
from shows.tmdb_client import tmdb_client
from shows.models import (
    cache_show_from_tmdb,
    get_cached_show,
    is_cache_stale,
    get_user_shows,
    add_show_to_user,
    update_user_show_status,
    remove_show_from_user,
)

router = APIRouter()


@router.get("/search", response_model=ShowSearchResponse)
async def search_shows(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
):
    """
    Search for TV shows using TMDb API.
    Results are cached locally for faster subsequent lookups.
    """
    try:
        data = await tmdb_client.search_shows(query=q, page=page)
        results = [
            ShowSearchResult(
                id=r["id"],
                name=r.get("name", "Unknown"),
                overview=r.get("overview"),
                poster_path=r.get("poster_path"),
                first_air_date=r.get("first_air_date"),
                vote_average=r.get("vote_average"),
            )
            for r in data.get("results", [])
        ]
        return ShowSearchResponse(
            results=results,
            page=data.get("page", 1),
            total_pages=data.get("total_pages", 0),
            total_results=data.get("total_results", 0),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TMDb API error: {str(e)}")


@router.get("/trending")
async def get_trending_shows(
    time_window: str = Query("week", regex="^(day|week)$"),
):
    """Get trending TV shows."""
    try:
        shows = await tmdb_client.get_trending_shows(time_window=time_window)
        return {"results": shows}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TMDb API error: {str(e)}")


@router.get("/{show_id}")
async def get_show_details(show_id: int):
    """
    Get detailed information about a TV show.
    Uses cached data if available and fresh, otherwise fetches from TMDb.
    """
    # Check cache first
    cached = get_cached_show(show_id)
    if cached and not is_cache_stale(cached.get("cached_at", "")):
        return cached

    # Fetch from TMDb
    try:
        data = await tmdb_client.get_show_details(show_id)
        cache_show_from_tmdb(data)
        return data
    except Exception as e:
        # If TMDb fails but we have stale cache, return it
        if cached:
            return cached
        raise HTTPException(status_code=404, detail=f"Show not found: {str(e)}")


@router.get("/{show_id}/seasons/{season_number}")
async def get_season_details(show_id: int, season_number: int):
    """Get details about a specific season including all episodes."""
    try:
        data = await tmdb_client.get_season_details(show_id, season_number)
        return data
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Season not found: {str(e)}")


@router.post("/add")
async def add_show_to_list(
    body: UserShowCreate,
    user_id: str = Depends(get_current_user_id),
):
    """
    Add a show to user's tracking list.
    If the show isn't cached locally, fetch details from TMDb first.
    """
    show_id = body.show_id

    # Ensure show is in our database
    cached = get_cached_show(show_id)
    if not cached:
        try:
            data = await tmdb_client.get_show_details(show_id)
            cache_show_from_tmdb(data)
        except Exception as e:
            raise HTTPException(status_code=404, detail=f"Show not found: {str(e)}")

    # Add to user's list
    user_show_id = add_show_to_user(
        user_id=user_id,
        show_id=show_id,
        status=body.status,
        favorite=body.favorite,
    )

    return {"id": user_show_id, "message": "Show added to list"}


@router.get("/user/list")
async def get_user_show_list(user_id: str = Depends(get_current_user_id)):
    """Get all shows the authenticated user is tracking."""
    shows = get_user_shows(user_id)
    return {"shows": shows}


@router.patch("/{show_id}/status")
async def update_show_status(
    show_id: int,
    status: str = Query(..., regex="^(watching|completed|dropped|paused)$"),
    user_id: str = Depends(get_current_user_id),
):
    """Update the tracking status for a show."""
    success = update_user_show_status(user_id, show_id, status)
    if not success:
        raise HTTPException(status_code=404, detail="Show not in user's list")
    return {"message": "Status updated"}


@router.delete("/{show_id}")
async def remove_show_from_list(
    show_id: int,
    user_id: str = Depends(get_current_user_id),
):
    """Remove a show from user's tracking list."""
    success = remove_show_from_user(user_id, show_id)
    if not success:
        raise HTTPException(status_code=404, detail="Show not in user's list")
    return {"message": "Show removed from list"}
