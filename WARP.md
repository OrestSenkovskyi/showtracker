# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Key project documents

This repository currently consists primarily of English documentation that defines the intended design and setup for the ShowTracker app:

- `architecture-english-d1.md` – full system architecture, database schema, backend and frontend structure, AI recommendations, cost model, and prompts.
- `setup-guide-english.md` – step‑by‑step setup and deployment guide (API keys, local env, D1 creation, backend run, CI/CD).
- `master-guide-english.md` – high‑level orientation and reading order for the other docs.

When working in this repo, consult these documents first for architecture and configuration details before editing or generating code.

## High‑level architecture

ShowTracker is a TV/film episode tracker with the following architecture (see `architecture-english-d1.md` for full details):

- **Frontend**
  - React + Vite TypeScript SPA.
  - Intended to live under a `frontend/` directory.
  - Deployed to **Cloudflare Pages**, edge‑cached static assets.
  - Key conceptual areas (from the architecture doc):
    - `components/` – UI pieces like `Header`, `SearchBar`, `ShowCard`, `ProgressBar`, `EpisodeGrid`.
    - `pages/` – route‑level pages like `Login`, `Dashboard`, `ShowDetail`, `Search`.
    - `hooks/` – e.g. `useAuth`, `useShows` for client‑side data/auth management.
    - `api/client.ts` – thin HTTP client for talking to the backend API.

- **Backend API**
  - Python **FastAPI** application.
  - Intended layout (from `architecture-english-d1.md`):
    - `backend/main.py` – FastAPI app entrypoint, CORS, router wiring, `/health` endpoint.
    - `backend/config.py` – Pydantic settings (`GOOGLE_CLIENT_ID`, `TMDB_API_KEY`, `JWT_SECRET`, `CORS_ORIGINS`, `D1_DATABASE_ID`, etc.), loading from `.env`.
    - `backend/database.py` – D1 connection handler and query helpers.
    - `backend/schemas.py` – Pydantic request/response models.
    - `backend/auth/` – Google OAuth flow, JWT handling, `/api/auth` routes.
    - `backend/shows/` – TMDb client, show models, `/api/shows` routes.
    - `backend/episodes/` – episode tracking logic and `/api/episodes` routes.
    - `backend/schema.sql` – D1 database schema (also reproduced in the docs).
  - Exposed endpoints (conceptually):
    - `/health` – health check.
    - `/api/auth/*` – Google OAuth login/callback, JWT issuance.
    - `/api/shows/*` – search TMDb, add to watchlist, fetch show details.
    - `/api/episodes/*` – mark episodes watched, fetch progress.

- **Runtime & platform**
  - Backend is designed to run as **Cloudflare Workers** (Python via Wrangler) with a bound D1 database and optional KV for caching.
  - Frontend is served via **Cloudflare Pages**, with API calls routed to the Workers‑based FastAPI backend.

- **Database (Cloudflare D1 / SQLite)**
  - D1 is the primary data store; schema is defined in detail in `architecture-english-d1.md` and mirrored in `setup-guide-english.md`:
    - `users` – Google identity and profile.
    - `shows` – cached TMDb show metadata.
    - `user_shows` – per‑user tracking state (status, favorite, added_at).
    - `episodes_watched` – per‑episode watch markers.
  - Additional indexes support common queries (`idx_user_shows_user_id`, `idx_episodes_user`, `idx_shows_title`).

- **External services**
  - **Google OAuth2** for authentication.
  - **TMDb API** for show search, details, and trending lists.
  - Optional AI recommendation engine layered on top of `shows` + `user_shows` (see `architecture-english-d1.md`, section "AI & Recommendations").

- **CI/CD and deployment**
  - Intended CI/CD is via **GitHub Actions** workflow at `.github/workflows/deploy.yml`:
    - On push to `main`, install Python and Node toolchains, build the frontend, then deploy backend via Wrangler to Workers and frontend to Pages.
    - Uses GitHub Secrets for Cloudflare and app secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TMDB_API_KEY`, `JWT_SECRET`).

> Note: The `backend/` and `frontend/` directories have been implemented. The actual code is the source of truth; update the docs if they diverge.

## Environment and configuration

Core configuration is centralized conceptually in `backend/config.py` using `pydantic-settings` with `.env` loading (see snippets in `architecture-english-d1.md` and `setup-guide-english.md`):

- **Auth & APIs**
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.
  - `TMDB_API_KEY`.

- **JWT**
  - `JWT_SECRET`, `JWT_ALGORITHM` (default `HS256`), `JWT_EXPIRATION_DAYS`.

- **CORS**
  - `CORS_ORIGINS` – typically includes `http://localhost:3000` and `http://localhost:5173` for local frontend dev.

- **Database & Cloudflare**
  - `D1_DATABASE_ID` and Worker bindings configured in `wrangler.toml`.
  - Cloudflare account/token variables live in CI and local shell environment, not committed to the repo.

When generating code that relies on configuration, prefer reading from `Settings`/`.env` as described rather than hard‑coding values.

## Commonly used commands

These commands are taken directly from `setup-guide-english.md` and related docs. Some assume that the backend/frontend files have been created according to the documented structure.

### Docker (Recommended)

Run the entire stack with Docker Compose:

```bash
# Production mode (frontend on port 80, backend on 8000)
docker compose up --build

# Development mode with hot reload
docker compose --profile dev up backend-dev frontend-dev

# Stop all containers
docker compose down

# Rebuild after changes to Dockerfile
docker compose build --no-cache
```

### Python environment

Create and activate a virtual environment (macOS/Linux):

```bash
python3 -m venv venv
source venv/bin/activate
```

Install documented FastAPI backend dependencies:

```bash
pip install --upgrade pip
pip install fastapi uvicorn
pip install python-jose cryptography
pip install httpx python-dotenv
pip install pydantic pydantic-settings
```

### Running the FastAPI backend locally

Local dev server (from the backend root where `main.py` lives):

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Health check endpoint (from another terminal):

```bash
curl http://localhost:8000/health
```

### Cloudflare D1 database

Create the D1 database (once):

```bash
wrangler d1 create showtracker-db
```

Apply the documented schema from `schema.sql` locally and remotely:

```bash
wrangler d1 execute showtracker-db --local --file schema.sql
wrangler d1 execute showtracker-db --file schema.sql --remote
```

### Wrangler and Cloudflare Workers

Install Wrangler globally and authenticate:

```bash
npm install -g wrangler
wrangler --version
wrangler login
```

Deploy the backend Worker using `wrangler.toml` (production env):

```bash
wrangler deploy --env production
```

### Frontend build (React + Vite)

The docs assume a `frontend/` directory with a standard Vite React setup.

Build the frontend for production:

```bash
cd frontend
npm install
npm run build
```

Deploy built assets to Cloudflare Pages via Wrangler (once configured):

```bash
wrangler pages deploy frontend/dist --project-name showtracker
```

### GitHub Actions CI/CD

The intended deployment workflow (see `architecture-english-d1.md` and `setup-guide-english.md`) is triggered by pushing to `main` after the `.github/workflows/deploy.yml` file and required GitHub Secrets are configured:

```bash
git add .
git commit -m "Initial ShowTracker setup with D1"
git push -u origin main
```

This should run the "Deploy to Cloudflare" workflow to build and deploy the backend and frontend.

## Testing

Backend tests use **pytest** and are located in `backend/tests/`.

```bash
# Run all tests
cd backend
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_auth.py

# Run a specific test
pytest tests/test_auth.py::test_jwt_token_creation

# Run with coverage (if pytest-cov installed)
pytest --cov=. --cov-report=html
```

Tests are also run automatically in CI via GitHub Actions on every push and PR.

## How agents should work in this repo

- Treat `architecture-english-d1.md` as the source of truth for system design, data model, and intended directory layout.
- Treat `setup-guide-english.md` as the source of truth for concrete commands, API key requirements, and deployment flow.
- When creating actual backend or frontend code, follow the file and module structure described in these docs so that it matches the documented guides and CI assumptions.
- If the on-disk project structure diverges from what is documented, prefer aligning new changes with the current code layout but update the documentation (and this `WARP.md`) to keep them in sync.