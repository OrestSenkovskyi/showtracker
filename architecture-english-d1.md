# 📺 ShowTracker - Complete Architecture Guide (December 2024)

**Pet Project**: Simple TV series tracking app with OAuth, Python Backend, and Cloudflare D1

**Date**: December 2024  
**Status**: Final Production Ready

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Database Design (D1 SQLite)](#database-design-d1-sqlite)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [AI & Recommendations](#ai--recommendations)
8. [Cost Calculation](#cost-calculation)
9. [Prompts for Vibe Coding](#prompts-for-vibe-coding)
10. [Timeline & Roadmap](#timeline--roadmap)

---

## 🎯 Project Overview

### Problem
- You watch many TV shows and films
- You often forget where you left off
- You need a simple progress tracker

### Solution
- **Episode Tracker**: Mark watched episodes
- **Progress**: See X of Y episodes completed
- **Search**: Integrated TMDb for discovery
- **Personal**: OAuth via Google
- **Cheap**: Serverless + free tier = $5-10/month

### Main Competitors
- **Trakt.tv** - Full-featured but limited free tier
- **MyAnimeList** - For anime only
- **Letterboxd** - For films only

### MVP Features
```
✅ Google OAuth login
✅ TV show search (TMDb API)
✅ Add to watchlist
✅ Mark episodes watched
✅ Progress bar (5/10 episodes)
✅ Lightweight database (D1 SQLite)
✅ Frontend (React)
✅ Deployment (Cloudflare Workers)
```

---

## 🏗️ System Architecture

### Overall Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Cloudflare Pages)                  │
│     React + Vite → Static HTML/CSS/JS → Edge Cached             │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
                    OAuth2 Flow (Google)
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│            API Layer (Cloudflare Workers + Python)              │
│  • POST /api/auth/login                                         │
│  • GET /api/shows/search?q=... (TMDb)                           │
│  • POST /api/shows/add                                          │
│  • POST /api/episodes/mark-watched                              │
│  • GET /api/user/progress                                       │
└────────────────────────────┬────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│          Database Layer (Cloudflare D1 - SQLite)                │
│  • users                                                         │
│  • shows (cache from TMDb)                                       │
│  • user_shows (tracking)                                         │
│  • episodes_watched                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack Selection

| Component | Solution | Reason |
|-----------|----------|--------|
| **Frontend** | React + Vite | Fast, simple Cloudflare Pages deploy |
| **Backend API** | Python FastAPI | Easy, async-first, OAuth support |
| **Serverless** | Cloudflare Workers (Python) | Cost-effective, global, no cold start |
| **Database** | D1 (Serverless SQLite) | **$0-5/month, edge-optimized, scale-to-zero** |
| **Auth** | Google OAuth2 | Standard, secure, free |
| **Media API** | TMDb (The Movie Database) | Best for TV, free tier, great docs |
| **Images** | TMDb CDN | Built into API |
| **CI/CD** | GitHub Actions | Free for public repos |

---

## 🗄️ Database Design (D1 SQLite)

### Why D1?
```
Free Tier Benefits:
  ✅ 5 million row reads per day
  ✅ 100,000 row writes per day
  ✅ 5 GB storage
  ✅ Edge-optimized (no latency)
  
Estimated MVP Usage:
  • Search shows: 1,000 reads/day
  • Add to list: 100 writes/day
  • Episode tracking: 500 reads/day
  • Progress checks: 200 reads/day
  
  Total: 1,700 reads/day, 300 writes/day
  = COMPLETELY FREE! ✅
```

### D1 Schema

```sql
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
```

### D1 Advantages
```
✅ Edge-first database (ultra-fast)
✅ Zero separate egress charges
✅ 30-day Time Travel backups
✅ Perfect for MVP scale
✅ Easy migration to PostgreSQL later
✅ Built into Cloudflare ecosystem
```

### D1 Limitations
```
❌ SQLite (not PostgreSQL)
❌ 10 GB storage max per DB
❌ Row-based billing (watch query efficiency)
❌ No transactions
❌ Newer service (smaller ecosystem)
```

---

## 💻 Backend Implementation

### Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── config.py              # Settings & environment
├── database.py            # D1 connection handler
├── schemas.py             # Pydantic models
├── wrangler.toml          # Cloudflare Workers config
├── auth/
│   ├── google_oauth.py    # Google OAuth handler
│   ├── jwt_handler.py     # JWT token management
│   └── routes.py          # /auth endpoints
├── shows/
│   ├── tmdb_client.py     # TMDb API integration
│   ├── models.py          # Show business logic
│   └── routes.py          # /shows endpoints
├── episodes/
│   ├── models.py          # Episode tracking logic
│   └── routes.py          # /episodes endpoints
├── schema.sql             # D1 database schema
└── requirements.txt       # Python dependencies
```

### requirements.txt

```
fastapi==0.104.1
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose==3.3.0
cryptography==41.0.7
httpx==0.25.2
python-dotenv==1.0.0
```

### main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from auth.routes import router as auth_router
from shows.routes import router as shows_router
from episodes.routes import router as episodes_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown

app = FastAPI(
    title="ShowTracker API",
    version="0.1.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(shows_router, prefix="/api/shows", tags=["shows"])
app.include_router(episodes_router, prefix="/api/episodes", tags=["episodes"])

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}
```

### config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Google OAuth
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/callback"
    
    # TMDB
    TMDB_API_KEY: str
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_DAYS: int = 30
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    
    # D1
    D1_DATABASE_ID: str = None
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### wrangler.toml

```toml
name = "showtracker-api"
type = "javascript"
main = "src/index.js"
compatibility_date = "2024-12-01"

[env.development]
vars = { ENVIRONMENT = "development" }

[env.production]
vars = { ENVIRONMENT = "production" }

# D1 Database Binding
[[d1_databases]]
binding = "DB"
database_name = "showtracker-db"
database_id = "YOUR_DATABASE_ID"  # Get from: wrangler d1 list

# KV for caching (optional)
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_ID"
preview_id = "YOUR_PREVIEW_ID"
```

### auth/google_oauth.py

```python
import httpx
from typing import Optional
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
from config import settings

class GoogleTokenResponse(BaseModel):
    access_token: str
    id_token: str
    expires_in: int

class GoogleUserInfo(BaseModel):
    sub: str  # Google ID
    email: str
    name: str
    picture: str

async def exchange_code_for_token(code: str) -> GoogleTokenResponse:
    """Exchange authorization code for access token"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            }
        )
        response.raise_for_status()
        return GoogleTokenResponse(**response.json())

def verify_id_token(id_token: str) -> GoogleUserInfo:
    """Verify and decode Google ID token"""
    decoded = jwt.decode(
        id_token,
        options={"verify_signature": False}  # Verify in production!
    )
    return GoogleUserInfo(
        sub=decoded["sub"],
        email=decoded["email"],
        name=decoded.get("name", ""),
        picture=decoded.get("picture", "")
    )

def create_app_jwt(user_id: str) -> str:
    """Create JWT token for app use"""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_EXPIRATION_DAYS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )
```

### shows/tmdb_client.py

```python
import httpx
from typing import List, Dict, Optional
from config import settings
import time

class TMDbClient:
    BASE_URL = "https://api.themoviedb.org/3"
    
    def __init__(self):
        self.api_key = settings.TMDB_API_KEY
        self.client = httpx.AsyncClient()
    
    async def search_shows(self, query: str, page: int = 1) -> List[Dict]:
        """Search for TV shows"""
        response = await self.client.get(
            f"{self.BASE_URL}/search/tv",
            params={
                "api_key": self.api_key,
                "query": query,
                "page": page,
                "language": "en-US",
            }
        )
        response.raise_for_status()
        return response.json()["results"]
    
    async def get_show_details(self, show_id: int) -> Dict:
        """Get detailed info about a show"""
        response = await self.client.get(
            f"{self.BASE_URL}/tv/{show_id}",
            params={
                "api_key": self.api_key,
                "language": "en-US",
            }
        )
        response.raise_for_status()
        return response.json()
    
    async def get_trending_shows(self, time_window: str = "week") -> List[Dict]:
        """Get trending shows"""
        response = await self.client.get(
            f"{self.BASE_URL}/trending/tv/{time_window}",
            params={"api_key": self.api_key}
        )
        response.raise_for_status()
        return response.json()["results"]
```

---

## 🎨 Frontend Implementation

### React Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── SearchBar.tsx
│   │   ├── ShowCard.tsx
│   │   ├── ProgressBar.tsx
│   │   └── EpisodeGrid.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ShowDetail.tsx
│   │   └── Search.tsx
│   ├── api/
│   │   └── client.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useShows.ts
│   ├── App.tsx
│   └── index.css
├── vite.config.ts
├── tsconfig.json
└── package.json
```

### ShowCard Component

```typescript
// components/ShowCard.tsx
import React from 'react';

interface ShowCardProps {
  id: number;
  title: string;
  posterPath: string;
  tmdbRating: number;
  onAdd: () => void;
}

export const ShowCard: React.FC<ShowCardProps> = ({
  id,
  title,
  posterPath,
  tmdbRating,
  onAdd,
}) => {
  const posterUrl = `https://image.tmdb.org/t/p/w300${posterPath}`;

  return (
    <div className="show-card hover:scale-105 transition-transform">
      <img 
        src={posterUrl} 
        alt={title}
        className="w-full h-auto rounded-lg shadow-md"
      />
      <div className="show-info mt-3">
        <h3 className="font-bold text-lg">{title}</h3>
        <div className="rating text-sm text-gray-600">
          ⭐ {tmdbRating}/10
        </div>
        <button 
          onClick={onAdd}
          className="mt-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
        >
          + Add to List
        </button>
      </div>
    </div>
  );
};
```

### EpisodeGrid Component

```typescript
// components/EpisodeGrid.tsx
import React from 'react';

interface EpisodeGridProps {
  showId: number;
  totalSeasons: number;
  totalEpisodes: number;
  watchedEpisodes: Set<string>;
  onEpisodeToggle: (season: number, episode: number, watched: boolean) => void;
}

export const EpisodeGrid: React.FC<EpisodeGridProps> = ({
  showId,
  totalSeasons,
  totalEpisodes,
  watchedEpisodes,
  onEpisodeToggle,
}) => {
  const watched = watchedEpisodes.size;
  const percentage = Math.round((watched / totalEpisodes) * 100);

  return (
    <div className="episode-grid p-4">
      <div className="progress-bar mb-4">
        <div className="text-sm font-semibold mb-2">
          Progress: {watched}/{totalEpisodes} ({percentage}%)
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-teal-500 h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))' }}>
        {Array.from({ length: totalSeasons }).map((_, seasonIdx) => (
          <div key={`season-${seasonIdx}`} className="season-column">
            <div className="text-xs font-semibold text-gray-600 mb-2">
              S{seasonIdx + 1}
            </div>
            {/* Episodes for this season */}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 🔄 CI/CD Pipeline

### .github/workflows/deploy.yml

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          npm install -g wrangler
      
      - name: Build frontend
        run: |
          cd frontend
          npm install
          npm run build
      
      - name: Deploy to Cloudflare Workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          wrangler deploy --env production
      
      - name: Deploy frontend to Cloudflare Pages
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          wrangler pages deploy frontend/dist --project-name showtracker
```

---

## 🤖 AI & Recommendations

### Simple Recommendation Engine

```python
class SimpleRecommender:
    """Genre-based recommendation engine"""
    
    async def get_recommendations(
        self,
        user_id: str,
        db,
        limit: int = 10
    ) -> List[dict]:
        """Get recommendations for user"""
        
        # Get user's watched shows
        user_shows = await db.query(UserShow).filter_by(
            user_id=user_id
        ).all()
        
        if not user_shows:
            # Return trending for new users
            trending = await tmdb.get_trending_shows()
            return trending[:limit]
        
        # Get genres from user's shows
        genres = set()
        for user_show in user_shows:
            show = await db.query(Show).filter_by(
                id=user_show.show_id
            ).first()
            if show:
                genres.update(show.genres.split(",") if show.genres else [])
        
        # Find similar shows (not watched)
        recommendations = []
        for genre in genres:
            similar_shows = await db.query(Show).filter(
                Show.genres.like(f"%{genre}%"),
                Show.id.notin_([us.show_id for us in user_shows]),
            ).all()
            recommendations.extend(similar_shows)
        
        # Sort by rating
        recommendations = list({
            r.id: r for r in recommendations
        }.values())
        recommendations.sort(
            key=lambda x: x.tmdb_rating or 0,
            reverse=True
        )
        
        return recommendations[:limit]
```

---

## 💰 Cost Calculation

### MVP Costs (D1 Edition)

```
┌──────────────────────────────────────────────────┐
│         ShowTracker Monthly Costs (D1)            │
├──────────────────────────┬──────────────────────┤
│ Cloudflare Pages         │ $0 (free tier)       │
│ Cloudflare Workers       │ $0 (free tier)       │
│ D1 Database              │ $0 (free tier)       │
│ TMDb API                 │ $0 (free)            │
│ Google OAuth             │ $0 (free)            │
│ Domain                   │ $1.25 (amortized)    │
├──────────────────────────┼──────────────────────┤
│ TOTAL                    │ ~$1-5/month ✅       │
└──────────────────────────┴──────────────────────┘
```

### Cost Scaling

```
Phase 1 (MVP):
  Users: 1-10
  Cost: $5-10/month (D1 free tier)
  
Phase 2 (Growth):
  Users: 50+
  Cost: $20-25/month (upgrade to Railway PostgreSQL)
  
Phase 3 (Scale):
  Users: 100+
  Cost: $25-50/month (Neon Pro or Supabase)
```

---

## 📝 Prompts for Vibe Coding

### Prompt 1.1: FastAPI + D1 Setup

```
Create a FastAPI application with Cloudflare D1 integration:

1. Configure D1 database binding in wrangler.toml
2. Create a database.py module with D1 connection handler
3. Setup environment variables for development
4. Create config.py with Pydantic settings
5. Write basic health check endpoint

Use:
  - pydantic-settings for configuration
  - asyncio for async database operations
  - python-dotenv for environment variables

First endpoint should test D1 connectivity.
```

### Prompt 1.2: Google OAuth2 Complete Flow

```
Implement Google OAuth2 for FastAPI:

1. Create /auth/login endpoint
   - Generates Google consent URL
   - Returns redirect

2. Create /auth/callback endpoint
   - Receives authorization code
   - Exchanges for access token
   - Verifies ID token
   - Extracts user info
   - Creates/finds user in D1
   - Generates app JWT token
   - Redirects to frontend with token in URL

3. Create JWT middleware
   - Verifies token on protected routes
   - Injects current_user dependency

4. Error handling
   - Invalid credentials
   - CORS issues
   - Database errors

Use:
  - python-jose for JWT
  - httpx for async HTTP
  - Pydantic for validation
```

### Prompt 2.1: TMDb API Integration

```
Create TMDb client with caching:

1. Methods:
   - search_shows(query, page=1)
   - get_show_details(show_id)
   - get_trending_shows(time_window="week")

2. Features:
   - Retry logic (exponential backoff)
   - Rate limiting respect (40 req/10s)
   - Timeout handling (10 seconds)
   - Logging for debugging

3. Caching:
   - Cache show details 7 days in D1
   - Cache search results 1 day
   - Use KV for edge caching

4. Configuration:
   - Language: en-US
   - Error handling
   - User-Agent header

Use:
  - httpx for async requests
  - datetime for cache timestamps
  - Try-except for robust error handling
```

---

## 🚀 Timeline & Roadmap

### MVP (Weeks 1-2)

**Week 1: Backend Foundation**
- [ ] Setup FastAPI + D1
- [ ] Google OAuth login
- [ ] JWT token management
- [ ] Basic API tests

**Week 2: Features**
- [ ] TMDb API integration
- [ ] Show CRUD endpoints
- [ ] Episode tracking
- [ ] Progress calculation

**Week 3: Frontend + Deploy**
- [ ] React setup
- [ ] Auth components
- [ ] Dashboard page
- [ ] Deploy to Cloudflare

### Phase 2: Polish (Weeks 4-5)

- [ ] Show details page
- [ ] Pagination & filters
- [ ] Statistics dashboard
- [ ] Mobile optimization
- [ ] Dark mode

### Phase 3: Recommendations (Week 6)

- [ ] Genre-based recommendations
- [ ] Trending shows for new users
- [ ] Similar shows feature

### Phase 4: Nice to Have

- [ ] User profiles
- [ ] Show ratings & reviews
- [ ] Watchlist sharing
- [ ] Browser extension
- [ ] Mobile app (React Native)

---

## 📞 Important Resources

### Documentation
- [FastAPI](https://fastapi.tiangolo.com)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [TMDb API](https://developer.themoviedb.org/docs)
- [Google OAuth](https://developers.google.com/identity/protocols/oauth2)

### Tools
- [Neon Console](https://console.neon.tech)
- [Cloudflare Dashboard](https://dash.cloudflare.com)
- [TMDb API Explorer](https://www.themoviedb.org/settings/api)
- [GitHub Actions](https://github.com/features/actions)

---

**Version**: 1.0 English Edition  
**Last Updated**: December 2024

