# 🚀 ShowTracker - Complete Step-by-Step Setup Guide (English)

**Target Audience**: Python developer ready to launch ShowTracker from zero to production  
**Completion Time**: ~3 hours total

---

## 📋 COMPLETE TIMELINE

```
Step 1: Get API Keys (30 minutes)
  ✓ Google OAuth credentials
  ✓ TMDB API key
  ✓ Cloudflare account setup

Step 2: Local Setup (30 minutes)
  ✓ Clone GitHub repo
  ✓ Python virtual environment
  ✓ Install dependencies

Step 3: Configure D1 (15 minutes)
  ✓ Create D1 database
  ✓ Import schema
  ✓ Local binding

Step 4: Development & Testing (60 minutes)
  ✓ Run backend locally
  ✓ Test OAuth flow
  ✓ Test API endpoints

Step 5: Deploy to Cloudflare (30 minutes)
  ✓ GitHub integration
  ✓ Deploy Workers
  ✓ Deploy Pages
  ✓ Setup CI/CD

TOTAL: ~3 hours to production! 🎉
```

---

## 📝 PART 1: GET API KEYS (30 minutes)

### Section A: Google OAuth Credentials

**Where**: https://console.cloud.google.com/

#### Step 1.1: Create New Project

1. Go to https://console.cloud.google.com/
2. Click **Select a Project** (top left)
3. Click **NEW PROJECT**
4. Enter name: `ShowTracker`
5. Click **CREATE**
6. Wait 1-2 minutes for creation

#### Step 1.2: Enable Required APIs

1. Go to **APIs & Services** (left panel)
2. Click **ENABLE APIS AND SERVICES** (blue button)
3. Search for: `Google+ API`
4. Click **ENABLE**

#### Step 1.3: Configure OAuth Consent Screen

1. Left panel: Click **OAuth consent screen**
2. Select **External**
3. Click **CREATE**
4. Fill form:
   ```
   App name: ShowTracker
   User support email: your_email@gmail.com
   Developer contact: your_email@gmail.com
   ```
5. Click **SAVE AND CONTINUE**
6. On **Scopes** page: Click **ADD OR REMOVE SCOPES**
7. Select:
   - `openid`
   - `email`
   - `profile`
8. Click **UPDATE**
9. Click **SAVE AND CONTINUE** twice

#### Step 1.4: Create OAuth Credentials

1. Left panel: Click **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Web application**
4. Name: `ShowTracker Web Client`
5. Under **Authorized JavaScript origins**, add:
   ```
   http://localhost:3000
   http://localhost:8000
   ```
6. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:8000/api/auth/callback
   http://localhost:3000/auth/callback
   ```
7. Click **CREATE**

**🎉 SAVE THESE:**
```
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

---

### Section B: TMDB API Key

**Where**: https://www.themoviedb.org/

#### Step 2.1: Create Account

1. Go to https://www.themoviedb.org/
2. Click **Sign Up** (top right)
3. Fill form and create account
4. Verify email

#### Step 2.2: Get API Key

1. Login to TMDB
2. Go to **Settings** (profile icon → Settings)
3. Left panel: Click **API**
4. Click **Create** or **REQUEST AN API KEY**
5. Select **Developer**
6. Accept Terms and fill form:
   ```
   Application Name: ShowTracker
   Application URL: http://localhost:8000
   Application Description: TV show tracking app
   ```
7. Submit

**🎉 SAVE THIS:**
```
TMDB_API_KEY=your_tmdb_api_key
```

---

### Section C: Cloudflare Setup

**Where**: https://dash.cloudflare.com/

#### Step 3.1: Create Account

1. Go to https://dash.cloudflare.com/
2. Click **Sign Up**
3. Create account and verify email

#### Step 3.2: Create API Token

1. Click profile icon → **My Profile**
2. Click **API Tokens**
3. Click **Create Token**
4. Select template: **Edit Cloudflare Workers**
5. Click **Use template**
6. Review and click **Continue to summary**
7. Click **Create Token**

**🎉 SAVE THIS (shown only once!):**
```
CLOUDFLARE_API_TOKEN=your_api_token
```

#### Step 3.3: Get Account ID

1. In Cloudflare dashboard, click any domain or project
2. Right panel: Find **Account ID**
3. Click to copy

**🎉 SAVE THIS:**
```
CLOUDFLARE_ACCOUNT_ID=your_account_id
```

---

## 🎉 SUMMARY: ALL YOUR KEYS

You should now have:

```
# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSP-xxx
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback

# TMDB
TMDB_API_KEY=xxx

# Cloudflare
CLOUDFLARE_API_TOKEN=xxx
CLOUDFLARE_ACCOUNT_ID=xxx

# JWT Secret (generate yourself)
JWT_SECRET=$(python -c "import secrets; print(secrets.token_urlsafe(32))")
```

---

## 📥 PART 2: LOCAL SETUP (30 minutes)

### Step 1: Clone Repository

```bash
# Create project directory
cd ~/projects
git clone https://github.com/YOUR_USERNAME/showtracker.git
cd showtracker
```

If no repo yet:
```bash
mkdir showtracker && cd showtracker
git init
git remote add origin https://github.com/YOUR_USERNAME/showtracker.git
git branch -M main
```

### Step 2: Create .env File

Copy the example environment file and fill in your API keys:

```bash
cp .env.example .env
# Edit .env with your actual API keys from Part 1
```

### Step 3: Run with Docker (Recommended)

Docker is the easiest way to run ShowTracker locally:

```bash
# Production mode (frontend on port 80, backend on 8000)
docker compose up --build

# Access the app:
# - Frontend: http://localhost
# - Backend API: http://localhost:8000
# - API Docs: http://localhost:8000/docs
```

For development with hot reload:

```bash
# Development mode with live reloading
docker compose --profile dev up backend-dev frontend-dev

# Access the app:
# - Frontend: http://localhost:5173 (with hot reload)
# - Backend API: http://localhost:8000 (with auto-reload)
```

Useful Docker commands:

```bash
# Stop all containers
docker compose down

# Rebuild after code changes
docker compose build --no-cache

# View logs
docker compose logs -f backend
docker compose logs -f frontend

# Run a single service
docker compose up backend
```

---

### Alternative: Run without Docker

If you prefer not to use Docker:

### Step 3a: Python Setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate (macOS/Linux)
source venv/bin/activate

# Activate (Windows)
venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install fastapi uvicorn
pip install python-jose cryptography
pip install httpx python-dotenv
pip install pydantic pydantic-settings
```

### Step 3: Install Wrangler (for Cloudflare)

```bash
# Install Wrangler globally
npm install -g wrangler

# Verify installation
wrangler --version

# Login to Cloudflare
wrangler login
# Opens browser for authorization - click "Authorize"
```

### Step 4: Create .env File

Create `.env` in project root:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/callback

# TMDB API
TMDB_API_KEY=your_tmdb_key_here

# JWT Secret (generate random)
JWT_SECRET=your_random_secret_here

# Database
DATABASE_URL=sqlite:///./test.db

# Cloudflare
CLOUDFLARE_API_TOKEN=your_token_here
CLOUDFLARE_ACCOUNT_ID=your_account_id_here

# CORS Origins
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

**IMPORTANT**: Add to `.gitignore`:
```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

---

## 🗄️ PART 3: CONFIGURE D1 (15 minutes)

### Step 1: Create D1 Database

```bash
# Create database
wrangler d1 create showtracker-db

# Output will show:
# ✅ Created D1 database 'showtracker-db'
# Database ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**SAVE THIS DATABASE ID!**

### Step 2: Update wrangler.toml

Create `wrangler.toml` in project root:

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
database_id = "PASTE_YOUR_DATABASE_ID_HERE"

# KV for caching (optional)
[[kv_namespaces]]
binding = "CACHE"
id = "YOUR_KV_ID"
preview_id = "YOUR_PREVIEW_ID"
```

### Step 3: Import Database Schema

Create `schema.sql`:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shows table
CREATE TABLE IF NOT EXISTS shows (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    overview TEXT,
    poster_path TEXT,
    total_episodes INTEGER,
    total_seasons INTEGER,
    genres TEXT,
    tmdb_rating REAL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User shows
CREATE TABLE IF NOT EXISTS user_shows (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    show_id INTEGER NOT NULL,
    status TEXT DEFAULT 'watching',
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_shows_user_id ON user_shows(user_id);
CREATE INDEX IF NOT EXISTS idx_episodes_user ON episodes_watched(user_id, show_id);
```

Import schema:

```bash
# Local import
wrangler d1 execute showtracker-db --local --file schema.sql

# Production import
wrangler d1 execute showtracker-db --file schema.sql --remote
```

---

## 💻 PART 4: DEVELOPMENT & TESTING (60 minutes)

### Step 1: Create FastAPI Backend

Create `main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ShowTracker API", version="0.1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}

@app.get("/api/test-db")
async def test_db():
    return {"status": "db_ok", "message": "D1 connected"}
```

### Step 2: Run Backend Locally

```bash
# Activate venv if not already active
source venv/bin/activate

# Run FastAPI
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Should output:
# Uvicorn running on http://0.0.0.0:8000
```

### Step 3: Test Health Endpoint

In new terminal:

```bash
# Test health check
curl http://localhost:8000/health

# Should return:
# {"status":"ok","version":"0.1.0"}
```

### Step 4: Test OAuth Redirect

```bash
# Visit in browser
http://localhost:8000/api/auth/login

# Should redirect to Google consent screen
```

---

## 🌐 PART 5: DEPLOY TO CLOUDFLARE (30 minutes)

### Step 1: Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

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
      
      - name: Deploy to Cloudflare Workers
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
        run: |
          wrangler deploy --env production
```

### Step 2: Add GitHub Secrets

1. Go to GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add:

```
CLOUDFLARE_API_TOKEN = your_token
CLOUDFLARE_ACCOUNT_ID = your_account_id
GOOGLE_CLIENT_ID = your_client_id
GOOGLE_CLIENT_SECRET = your_client_secret
TMDB_API_KEY = your_tmdb_key
JWT_SECRET = your_secret
```

### Step 3: Commit and Push

```bash
# Stage all changes
git add .

# Commit
git commit -m "Initial ShowTracker setup with D1"

# Push to main branch
git push -u origin main

# GitHub Actions will automatically deploy!
# Check: https://github.com/YOUR_USERNAME/showtracker/actions
```

### Step 4: Monitor Deployment

1. Go to GitHub repo → **Actions**
2. Watch the "Deploy to Cloudflare" workflow
3. Should complete in ~2-3 minutes
4. Check Cloudflare dashboard for deployed Workers

---

## ✅ DEPLOYMENT CHECKLIST

Before launching, verify:

```
API Keys:
  ☑ GOOGLE_CLIENT_ID & SECRET obtained
  ☑ TMDB API KEY obtained
  ☑ CLOUDFLARE_API_TOKEN & ACCOUNT_ID obtained
  ☑ JWT_SECRET generated

Local Setup:
  ☑ Python venv created
  ☑ FastAPI running locally
  ☑ /health endpoint responds
  ☑ .env file configured
  ☑ .env in .gitignore

D1 Database:
  ☑ D1 database created
  ☑ Schema imported successfully
  ☑ wrangler.toml updated with database ID
  ☑ Local D1 binding tested

GitHub:
  ☑ Repository created on GitHub
  ☑ Code pushed to main branch
  ☑ GitHub Secrets configured
  ☑ CI/CD workflow enabled

Cloudflare:
  ☑ Workers deployment successful
  ☑ Pages deployment successful
  ☑ OAuth redirect URIs updated in Google Console
  ☑ Production URLs accessible

YOU'RE READY TO LAUNCH! 🚀
```

---

## 🆘 TROUBLESHOOTING

### "GOOGLE_CLIENT_ID not found"
```
Fix: Check .env file format:
GOOGLE_CLIENT_ID=xxxxx
(not GOOGLE_CLIENT_ID = xxxxx)
```

### "D1 database not binding"
```
Fix: Check wrangler.toml database_id is correct:
wrangler d1 list  # see all databases
```

### "OAuth redirect_uri_mismatch"
```
Fix: Update Google Console OAuth settings:
Add http://localhost:8000/api/auth/callback
for local testing
```

### "TMDB API returns 401"
```
Fix: Check API Key in .env and TMDB website:
https://www.themoviedb.org/settings/api
Use the v3 auth API key
```

### "Cloudflare Workers timeout"
```
Fix: Workers have 30-second timeout
Split long operations into async tasks
Or run sync jobs via Neon cron
```

---

## 📞 NEXT STEPS

After successful deployment:

1. **Add OAuth Endpoints** (from architecture guide)
2. **Add TMDb Integration** (show search)
3. **Implement Episode Tracking** (main feature)
4. **Add Frontend** (React components)
5. **Test with friends** (beta testing)
6. **Monitor and improve** (based on feedback)

---

## 📞 QUICK HELP

```
"I'm stuck on API keys" → Re-read PART 1
"Local setup not working" → Re-read PART 2
"D1 error" → Re-read PART 3
"Backend won't start" → Re-read PART 4
"Deploy failed" → Re-read PART 5 & Troubleshooting
```

---

**Ready to launch? START FROM PART 1! 🚀**

