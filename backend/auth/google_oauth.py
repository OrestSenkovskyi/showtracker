import httpx
from typing import Optional
from urllib.parse import urlencode
from pydantic import BaseModel

from config import settings


class GoogleTokenResponse(BaseModel):
    access_token: str
    id_token: str
    expires_in: int
    token_type: str
    scope: str
    refresh_token: Optional[str] = None


class GoogleUserInfo(BaseModel):
    sub: str  # Google ID
    email: str
    email_verified: bool = True
    name: str = ""
    picture: str = ""


GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def get_google_auth_url(state: Optional[str] = None) -> str:
    """Generate the Google OAuth consent URL."""
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
    }
    if state:
        params["state"] = state
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> GoogleTokenResponse:
    """Exchange authorization code for access token."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        response.raise_for_status()
        data = response.json()
        return GoogleTokenResponse(**data)


async def get_user_info(access_token: str) -> GoogleUserInfo:
    """Fetch user info from Google using access token."""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        response.raise_for_status()
        data = response.json()
        return GoogleUserInfo(**data)
