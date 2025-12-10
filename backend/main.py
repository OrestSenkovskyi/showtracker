from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db

# Import routers
from auth.routes import router as auth_router
from shows.routes import router as shows_router
from episodes.routes import router as episodes_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database
    init_db()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="ShowTracker API",
    version="0.1.0",
    description="TV series episode tracking API",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(shows_router, prefix="/api/shows", tags=["shows"])
app.include_router(episodes_router, prefix="/api/episodes", tags=["episodes"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "version": "0.1.0"}


@app.get("/")
async def root():
    """Root endpoint with basic info."""
    return {
        "app": "ShowTracker API",
        "version": "0.1.0",
        "docs": "/docs",
    }
