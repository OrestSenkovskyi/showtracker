import httpx
from typing import List, Dict, Any, Optional

from config import settings


class TMDbClient:
    """Client for The Movie Database (TMDb) API."""

    BASE_URL = "https://api.themoviedb.org/3"
    IMAGE_BASE_URL = "https://image.tmdb.org/t/p"

    def __init__(self):
        self.api_key = settings.TMDB_API_KEY

    def _get_headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "User-Agent": "ShowTracker/0.1.0",
        }

    async def search_shows(
        self,
        query: str,
        page: int = 1,
        language: str = "en-US",
    ) -> Dict[str, Any]:
        """
        Search for TV shows by query.
        Returns paginated results with show metadata.
        """
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.BASE_URL}/search/tv",
                params={
                    "api_key": self.api_key,
                    "query": query,
                    "page": page,
                    "language": language,
                },
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def get_show_details(
        self,
        show_id: int,
        language: str = "en-US",
    ) -> Dict[str, Any]:
        """
        Get detailed information about a specific TV show.
        """
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.BASE_URL}/tv/{show_id}",
                params={
                    "api_key": self.api_key,
                    "language": language,
                },
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def get_show_external_ids(self, show_id: int) -> Dict[str, Any]:
        """Get external IDs (IMDB, etc.) for a show."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.BASE_URL}/tv/{show_id}/external_ids",
                params={"api_key": self.api_key},
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    async def get_trending_shows(
        self,
        time_window: str = "week",
    ) -> List[Dict[str, Any]]:
        """
        Get trending TV shows.
        time_window: 'day' or 'week'
        """
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.BASE_URL}/trending/tv/{time_window}",
                params={"api_key": self.api_key},
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json().get("results", [])

    async def get_season_details(
        self,
        show_id: int,
        season_number: int,
        language: str = "en-US",
    ) -> Dict[str, Any]:
        """Get details about a specific season including episodes."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.BASE_URL}/tv/{show_id}/season/{season_number}",
                params={
                    "api_key": self.api_key,
                    "language": language,
                },
                headers=self._get_headers(),
            )
            response.raise_for_status()
            return response.json()

    @staticmethod
    def get_poster_url(poster_path: Optional[str], size: str = "w300") -> Optional[str]:
        """Generate full poster URL from path."""
        if not poster_path:
            return None
        return f"{TMDbClient.IMAGE_BASE_URL}/{size}{poster_path}"

    @staticmethod
    def get_backdrop_url(
        backdrop_path: Optional[str], size: str = "w780"
    ) -> Optional[str]:
        """Generate full backdrop URL from path."""
        if not backdrop_path:
            return None
        return f"{TMDbClient.IMAGE_BASE_URL}/{size}{backdrop_path}"


# Singleton instance
tmdb_client = TMDbClient()
