# ShowTracker

A simple TV series and movie episode tracker with Google OAuth, TMDb integration, and progress tracking.

## Features

- **Google OAuth** – Secure authentication via Google
- **TMDb Integration** – Search and browse TV shows from The Movie Database
- **Episode Tracking** – Mark episodes as watched, track progress per show
- **Progress Dashboard** – See your watching stats and progress bars
- **Responsive UI** – Works on desktop and mobile

## Tech Stack

- **Backend**: Python FastAPI
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Database**: SQLite (local) / Cloudflare D1 (production)
- **Deployment**: Cloudflare Workers + Pages

## Quick Start

### Prerequisites

- Docker and Docker Compose (recommended)
- Or: Python 3.11+, Node.js 20+

### 1. Clone and Configure

```bash
git clone https://github.com/YOUR_USERNAME/showtracker.git
cd showtracker

# Copy environment template
cp .env.example .env
```

Edit `.env` and add your API keys:
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` from [Google Cloud Console](https://console.cloud.google.com/)
- `TMDB_API_KEY` from [TMDb](https://www.themoviedb.org/settings/api)
- `JWT_SECRET` – generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`

### 2. Run with Docker (Recommended)

**Production mode:**
```bash
docker compose up --build
```
- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Development mode (with hot reload):**
```bash
docker compose --profile dev up backend-dev frontend-dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### 3. Run without Docker

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
showtracker/
├── backend/                 # FastAPI backend
│   ├── auth/               # Google OAuth & JWT
│   ├── shows/              # TMDb client & show tracking
│   ├── episodes/           # Episode tracking logic
│   ├── main.py             # FastAPI app entry
│   ├── config.py           # Settings (loads .env)
│   ├── database.py         # SQLite helpers
│   ├── schemas.py          # Pydantic models
│   ├── schema.sql          # Database schema
│   └── Dockerfile
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── api/           # API client
│   │   ├── components/    # UI components
│   │   ├── hooks/         # React hooks
│   │   └── pages/         # Route pages
│   └── Dockerfile
├── docker-compose.yml      # Docker orchestration
├── wrangler.toml          # Cloudflare Workers config
└── .env.example           # Environment template
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/login` | GET | Get Google OAuth URL |
| `/api/auth/callback` | GET | OAuth callback |
| `/api/shows/search` | GET | Search TMDb for shows |
| `/api/shows/trending` | GET | Get trending shows |
| `/api/shows/{id}` | GET | Get show details |
| `/api/shows/add` | POST | Add show to user's list |
| `/api/shows/user/list` | GET | Get user's tracked shows |
| `/api/episodes/mark-watched` | POST | Mark episode as watched |
| `/api/episodes/progress` | GET | Get user's overall progress |

## Deployment

See [setup-guide-english.md](./setup-guide-english.md) for detailed Cloudflare deployment instructions.

```bash
# Deploy to Cloudflare
wrangler d1 create showtracker-db
wrangler d1 execute showtracker-db --file backend/schema.sql --remote
wrangler deploy --env production
wrangler pages deploy frontend/dist --project-name showtracker
```

## Documentation

- [Architecture Guide](./architecture-english-d1.md) – Full system design
- [Setup Guide](./setup-guide-english.md) – Step-by-step setup
- [Master Guide](./master-guide-english.md) – Reading order & overview

## License

MIT
