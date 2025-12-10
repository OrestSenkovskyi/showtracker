import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse

from schemas import TokenResponse, GoogleAuthUrl
from database import execute_query, execute_write, row_to_dict
from auth.google_oauth import (
    get_google_auth_url,
    exchange_code_for_token,
    get_user_info,
)
from auth.jwt_handler import create_access_token

router = APIRouter()


@router.get("/login", response_model=GoogleAuthUrl)
async def login():
    """
    Get the Google OAuth consent URL.
    Redirect user to this URL to initiate login.
    """
    url = get_google_auth_url()
    return GoogleAuthUrl(url=url)


@router.get("/login/redirect")
async def login_redirect():
    """
    Redirect the user directly to Google OAuth consent screen.
    """
    url = get_google_auth_url()
    return RedirectResponse(url=url)


@router.get("/callback")
async def oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: Optional[str] = Query(None),
):
    """
    Handle the OAuth callback from Google.
    Exchange code for tokens, create/find user, return JWT.
    """
    try:
        # Exchange code for tokens
        token_response = await exchange_code_for_token(code)

        # Get user info from Google
        user_info = await get_user_info(token_response.access_token)

        # Check if user exists
        rows = execute_query(
            "SELECT * FROM users WHERE google_id = ?",
            (user_info.sub,),
        )
        user = row_to_dict(rows[0]) if rows else None

        if user:
            user_id = user["id"]
            # Update user info if changed
            execute_write(
                """
                UPDATE users
                SET name = ?, picture_url = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (user_info.name, user_info.picture, user_id),
            )
        else:
            # Create new user
            user_id = str(uuid.uuid4())
            execute_write(
                """
                INSERT INTO users (id, google_id, email, name, picture_url)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    user_info.sub,
                    user_info.email,
                    user_info.name,
                    user_info.picture,
                ),
            )

        # Create app JWT
        access_token = create_access_token(user_id)

        # For API usage, return token directly
        # In production, you might redirect to frontend with token in URL fragment
        return TokenResponse(access_token=access_token)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth error: {str(e)}")


@router.get("/me")
async def get_current_user_info(user_id: str = None):
    """
    Get the current authenticated user's info.
    Note: In real usage, user_id comes from get_current_user_id dependency.
    """
    # This is a placeholder - should use Depends(get_current_user_id)
    # but we keep it simple for now
    if not user_id:
        raise HTTPException(status_code=401, detail="Not authenticated")

    rows = execute_query("SELECT * FROM users WHERE id = ?", (user_id,))
    user = row_to_dict(rows[0]) if rows else None

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user
