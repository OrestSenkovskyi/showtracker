# 🎨 ShowTracker - Vibe Coding Prompts (English)

**Purpose**: Copy & paste these prompts to Claude, ChatGPT, or any AI assistant  
**Format**: Optimized for maximum code generation quality  
**Language**: English  
**Updated**: December 2024

---

## 📋 HOW TO USE THIS GUIDE

1. **Copy ONE prompt** from this file
2. **Paste into Claude/ChatGPT**
3. **Adjust YOUR_VAR values** if needed
4. **Get complete code** instantly
5. **Integrate into your project**
6. **Move to next prompt**

---

## 🏗️ BLOCK 1: PROJECT SETUP

### Prompt 1.1: FastAPI + D1 Basic Setup

```
Create a FastAPI application that works with Cloudflare D1:

Requirements:
1. Main application file (main.py) with:
   - FastAPI initialization
   - CORS middleware configuration
   - Basic health check endpoint (/health)
   - Error handling middleware

2. Configuration file (config.py) with:
   - Pydantic BaseSettings
   - Environment variables (GOOGLE_CLIENT_ID, TMDB_API_KEY, JWT_SECRET, CLOUDFLARE_ACCOUNT_ID)
   - CORS origins list
   - Database configuration

3. Database handler (database.py) with:
   - D1 database connection initialization
   - Async context manager for database sessions
   - Simple test query function

4. Requirements.txt with:
   - fastapi==0.104.1
   - uvicorn[standard]==0.24.0
   - pydantic==2.5.0
   - pydantic-settings==2.1.0
   - python-dotenv==1.0.0
   - httpx==0.25.2
   - python-jose==3.3.0
   - cryptography==41.0.7

Use async/await throughout.
Include type hints for all functions.
Make code production-ready.
```

### Prompt 1.2: Wrangler Configuration for D1

```
Create a wrangler.toml configuration file for Cloudflare Workers with D1 database:

Requirements:
1. Project metadata:
   - name: showtracker-api
   - type: javascript
   - main: src/index.js
   - compatibility_date: 2024-12-01

2. Environment configurations:
   - development environment with ENVIRONMENT var
   - production environment with ENVIRONMENT var

3. D1 Database binding:
   - binding name: DB
   - database_name: showtracker-db
   - database_id: placeholder for user to fill

4. KV namespace for caching:
   - binding name: CACHE
   - id and preview_id as placeholders

5. Environment variables:
   - GOOGLE_CLIENT_ID
   - GOOGLE_CLIENT_SECRET
   - TMDB_API_KEY
   - JWT_SECRET

Include comments explaining what each section does.
Make it clear where user needs to insert their own IDs.
```

---

## 🔐 BLOCK 2: AUTHENTICATION

### Prompt 2.1: Google OAuth2 Complete Implementation

```
Create complete Google OAuth2 implementation for FastAPI:

Requirements:
1. auth/google_oauth.py module with:
   - GoogleTokenResponse Pydantic model
   - GoogleUserInfo Pydantic model
   - exchange_code_for_token() async function
     * Makes POST request to Google OAuth token endpoint
     * Handles errors gracefully
     * Returns GoogleTokenResponse
   - verify_id_token() function
     * Decodes JWT ID token
     * Extracts user information
     * Returns GoogleUserInfo
   - create_app_jwt() function
     * Creates JWT token for app use
     * Sets expiration from config
     * Uses HS256 algorithm

2. auth/routes.py module with:
   - /auth/login GET endpoint
     * Generates Google OAuth consent URL
     * Includes all required parameters (client_id, redirect_uri, scopes)
     * Returns RedirectResponse
   - /auth/callback GET endpoint
     * Receives authorization code from Google
     * Calls exchange_code_for_token()
     * Verifies ID token
     * Finds or creates user in D1 database
     * Generates app JWT token
     * Redirects to frontend with token in URL
     * Includes error handling for all steps
   - /auth/refresh POST endpoint
     * Refreshes JWT token for authenticated users

3. auth/jwt_handler.py with:
   - verify_jwt_token() async function
     * Verifies JWT signature
     * Checks expiration
     * Extracts user_id
   - jwt_dependency for FastAPI
     * Use as dependency in protected routes
     * Returns current user info

Use error handling with HTTPException.
Include logging for debugging.
Handle CORS issues properly.
```

### Prompt 2.2: D1 User Management

```
Create user management functions for D1 SQLite database:

Requirements:
1. Async functions:
   - create_user(db, google_id, email, name, picture_url)
     * Inserts new user into users table
     * Returns created user
     * Handles duplicate key errors
   
   - get_user_by_google_id(db, google_id)
     * Queries users table
     * Returns user or None
   
   - get_user_by_id(db, user_id)
     * Returns user with UUID
   
   - update_user(db, user_id, data)
     * Updates user fields
     * Returns updated user

2. Database schema SQL:
   - CREATE TABLE users with:
     * id TEXT PRIMARY KEY
     * google_id TEXT UNIQUE NOT NULL
     * email TEXT UNIQUE NOT NULL
     * name TEXT
     * picture_url TEXT
     * created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
     * updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

3. Pydantic models:
   - UserBase with email, name, picture_url
   - UserCreate with google_id
   - UserResponse with id, email, name, created_at

Include type hints.
Use async/await.
Handle database errors.
Add docstrings.
```

---

## 🎬 BLOCK 3: TMDB INTEGRATION

### Prompt 3.1: TMDb API Client

```
Create TMDb API client for TV show data:

Requirements:
1. shows/tmdb_client.py class:
   - TMDbClient class with:
     * BASE_URL = "https://api.themoviedb.org/3"
     * __init__(api_key) method
     * async methods:
       - search_shows(query, page=1)
         * Returns list of shows from search results
       - get_show_details(show_id)
         * Returns complete show information
       - get_trending_shows(time_window="week")
         * Returns trending shows
       - get_show_episodes(show_id, season)
         * Returns episodes for a season

2. Features:
   - Retry logic with exponential backoff (3 attempts)
   - Request timeout of 10 seconds
   - Rate limiting awareness (40 req/10s)
   - Proper error handling with try-except
   - Request logging for debugging
   - User-Agent header
   - Language parameter: en-US

3. Response handling:
   - Parse JSON responses
   - Handle API errors gracefully
   - Return clean data structures
   - Include null safety checks

Include docstrings for each method.
Use httpx for async HTTP.
Handle network timeouts.
Log API calls for debugging.
```

### Prompt 3.2: Show Caching in D1

```
Create show caching system for D1 SQLite:

Requirements:
1. shows/models.py with:
   - cache_show_details(db, show_data)
     * Inserts or updates show in D1
     * Stores TMDb data
     * Sets cached_at timestamp
   
   - get_cached_show(db, show_id)
     * Returns cached show if exists
     * Checks if cache is fresh (7 days)
     * Returns None if expired
   
   - sync_trending_shows(db, tmdb_client)
     * Fetches top trending shows from TMDb
     * Caches them in D1
     * Handles duplicates
     * Returns list of cached show IDs

2. D1 Shows table schema:
   - id INTEGER PRIMARY KEY (TMDb ID)
   - title TEXT NOT NULL
   - overview TEXT
   - poster_path TEXT
   - backdrop_path TEXT
   - first_air_date TEXT
   - total_episodes INTEGER
   - total_seasons INTEGER
   - genres TEXT (JSON string)
   - tmdb_rating REAL
   - external_ids TEXT (JSON)
   - cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

3. Functions to handle:
   - Batch insertions for performance
   - Update existing records
   - Clean up old cache (optional)
   - Query optimization with indexes

Use async operations.
Handle edge cases.
Include error handling.
```

---

## 📺 BLOCK 4: EPISODE TRACKING

### Prompt 4.1: Episode Tracking Logic

```
Create episode tracking endpoints for FastAPI:

Requirements:
1. episodes/routes.py with endpoints:
   
   - POST /api/episodes/mark-watched
     * Request: show_id (int), season (int), episode (int)
     * Validates user has show in watchlist
     * Inserts into episodes_watched table
     * Returns updated progress
   
   - POST /api/episodes/mark-unwatched
     * Request: show_id, season, episode
     * Deletes from episodes_watched
     * Returns updated progress
   
   - GET /api/episodes/progress/{show_id}
     * Returns progress for a show:
       - watched_episodes: list of {season, episode}
       - total_episodes: from show
       - percentage: calculated
       - current_position: next episode to watch
   
   - GET /api/shows/{show_id}/episodes/{season}
     * Returns all episodes for a season
     * Shows which are watched (checked)
     * Shows episode details from TMDb

2. D1 episodes_watched table:
   - id TEXT PRIMARY KEY
   - user_id TEXT NOT NULL
   - show_id INTEGER NOT NULL
   - season INTEGER NOT NULL
   - episode INTEGER NOT NULL
   - watched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   - UNIQUE constraint on (user_id, show_id, season, episode)

3. Pydantic response models:
   - EpisodeResponse
   - ProgressResponse with watched_episodes, total_episodes, percentage
   - EpisodeDetailResponse

Include input validation.
Add proper error handling.
Use current_user dependency.
Optimize database queries.
```

### Prompt 4.2: Progress Calculation

```
Create progress calculation utilities for ShowTracker:

Requirements:
1. episodes/progress.py with functions:
   
   - calculate_show_progress(watched_episodes, total_episodes)
     * Input: list of {season, episode}, total count
     * Returns: {watched: int, total: int, percentage: float}
   
   - get_next_episode(watched_episodes, total_seasons)
     * Input: set of watched episodes, season count
     * Returns: {season: int, episode: int} or None
   
   - get_user_stats(db, user_id)
     * Returns:
       - total_shows: count by status (watching, completed, dropped)
       - total_episodes_watched: sum across all shows
       - favorite_genre: most common genre
       - average_rating: mean of watched show ratings
       - hours_watched: estimated (needs episode count data)
   
   - get_show_recommendations(db, user_id, limit=10)
     * Gets genres from user's watched shows
     * Finds similar shows user hasn't watched
     * Ranks by rating
     * Excludes completed/dropped shows
     * Returns top N shows

2. Database queries:
   - Optimized with proper indexes
   - Use aggregation functions (COUNT, AVG)
   - Single query operations (avoid N+1)
   - Proper joins for genre data

3. Response models:
   - ProgressData
   - UserStats
   - RecommendationItem

Include docstrings.
Add type hints.
Handle edge cases (no shows, no data).
Optimize for performance.
```

---

## 🎨 BLOCK 5: FRONTEND COMPONENTS

### Prompt 5.1: ShowCard React Component

```
Create a ShowCard React component with TypeScript:

Requirements:
1. Component props:
   - id: number (TMDb ID)
   - title: string
   - posterPath: string
   - rating: number (0-10)
   - status?: 'watching' | 'completed' | 'dropped'
   - isAdded?: boolean
   - isLoading?: boolean
   - onAdd: () => void
   - onRemove?: () => void

2. Visual design:
   - Card dimensions: 300x450px (standard TMDb poster size)
   - Poster image from https://image.tmdb.org/t/p/w300{posterPath}
   - Title overlay on hover
   - Rating badge (⭐ {rating}/10)
   - Status indicator (✓ watching, ✅ completed, etc)
   - Add/Remove button

3. States:
   - Loading: show skeleton loader
   - Error: show placeholder image + "No Poster"
   - Added: show "Remove" button
   - Not added: show "Add to List" button
   - Hover: overlay with action buttons

4. Styling:
   - Use Tailwind CSS
   - Classes: hover:scale-105, transition-transform, rounded-lg, shadow-md
   - Gradient overlay: bg-gradient-to-b from-transparent to-black/50
   - Responsive design

5. Features:
   - Keyboard accessible (Tab/Enter)
   - Loading state with spinner
   - Error boundary
   - Smooth transitions

Use React hooks (useState).
Include proper TypeScript types.
Handle image load errors.
Add accessibility attributes.
```

### Prompt 5.2: EpisodeGrid Component

```
Create an EpisodeGrid React component for marking episodes watched:

Requirements:
1. Component props:
   - showId: number
   - totalSeasons: number
   - totalEpisodes: number
   - episodesPerSeason: number[] (e.g., [10, 12, 8])
   - watchedEpisodes: Set<string> (format: "1-5" for season 1 episode 5)
   - onEpisodeToggle: (season, episode, watched) => void
   - isLoading: boolean

2. Layout:
   - Progress bar at top showing {watched}/{total} episodes and percentage
   - Grid of episode cells (responsive: 5-15 columns)
   - Each row = one season
   - Each cell = one episode with number
   - Season labels on left

3. Styling:
   - Watched episode: bg-teal-500 text-white
   - Unwatched: bg-slate-200 text-slate-600
   - Hover: cursor-pointer, brightness-110
   - Active (being clicked): ring-2 ring-teal-700
   - Disabled/future: opacity-50

4. Features:
   - Click episode to toggle watched/unwatched
   - "Mark season as watched" button
   - "Clear all" button
   - Loading spinner while updating
   - Keyboard navigation support
   - Mobile responsive (scroll horizontally if needed)
   - Batch operations for performance

5. Data display:
   - Current position indicator
   - Next episode to watch
   - Percentage complete
   - Estimated completion date (optional)

Use React hooks (useState, useCallback).
Optimize re-renders with useMemo.
Include TypeScript types.
Handle loading states.
Add accessibility (ARIA labels).
```

### Prompt 5.3: SearchBar Component

```
Create a SearchBar React component with real-time search:

Requirements:
1. Component props:
   - onSearch: (query: string, results: Show[]) => void
   - placeholder?: string
   - debounceMs?: number (default 300)

2. Features:
   - Input field with placeholder "Search shows..."
   - Real-time search with debounce (300ms)
   - Minimum 2 characters to search
   - Cancel previous requests on new input
   - Display loading spinner while searching

3. Results display:
   - Maximum 10 results per search
   - Show cards for each result (use ShowCard component)
   - Pagination (previous/next buttons)
   - "No results" message
   - Grid layout (3-4 columns on desktop, 1-2 on mobile)

4. Keyboard shortcuts:
   - Ctrl+K / Cmd+K: Focus search input
   - Escape: Clear input
   - Enter: Search or select first result
   - Arrow Up/Down: Navigate results

5. Initial state:
   - Show 3-5 random trending shows initially
   - Use trending endpoint from API
   - Let user start typing to search

6. Styling:
   - Use Tailwind CSS
   - Responsive design
   - Focus states for accessibility
   - Smooth transitions
   - Clear visual hierarchy

Use React hooks (useState, useEffect, useCallback, useRef).
Implement proper debouncing.
Cancel in-flight requests on cleanup.
Include error handling.
Add loading states.
Accessibility: ARIA labels, keyboard navigation.
```

---

## 📊 BLOCK 6: STATE MANAGEMENT

### Prompt 6.1: Auth Hook

```
Create a custom React useAuth hook for authentication:

Requirements:
1. useAuth() hook that manages:
   - token: string | null (from localStorage or URL params)
   - user: UserInfo | null
   - isAuthenticated: boolean
   - isLoading: boolean
   - error: string | null

2. Functions:
   - login()
     * Redirects to /api/auth/login
   - logout()
     * Clears token
     * Redirects to home
   - refresh()
     * Gets new token from /api/auth/refresh
   - checkAuth()
     * Verifies token is still valid

3. Features:
   - Check for token in URL params on mount
   - Store token in localStorage (HttpOnly would be better)
   - Automatically load user data from token
   - Handle CORS issues
   - Refresh token before expiration (optional)
   - Persist auth state across page reloads

4. Error handling:
   - Invalid token
   - Expired token
   - Network errors
   - Parse errors

Return object with:
  - token, user, isAuthenticated, isLoading, error
  - Functions: login, logout, refresh, checkAuth

Use useEffect for initialization.
Use useCallback to prevent re-renders.
Include proper TypeScript types.
Handle edge cases.
Add logging for debugging.
```

### Prompt 6.2: Shows Hook

```
Create a custom React useShows hook for show management:

Requirements:
1. useShows(userId) hook that provides:
   - myShows: Show[]
   - watchedEpisodes: Map<showId, Set<string>>
   - isLoading: boolean
   - error: string | null

2. Functions:
   - addShow(showId, status='watching')
     * POST /api/shows/add
     * Adds to myShows
   
   - removeShow(showId)
     * DELETE /api/shows/{showId}
     * Removes from myShows
   
   - markEpisodeWatched(showId, season, episode)
     * POST /api/episodes/mark-watched
     * Updates local state
   
   - markEpisodeUnwatched(showId, season, episode)
     * POST /api/episodes/mark-unwatched
     * Updates local state
   
   - getProgress(showId)
     * Returns {watched, total, percentage}
   
   - changeStatus(showId, status)
     * Updates show status (watching/completed/dropped)
   
   - toggleFavorite(showId)
     * Marks/unmarks as favorite

3. Caching:
   - Cache in React Context or localStorage
   - Invalidate on changes
   - Refetch on app focus (optional)

4. Error handling:
   - API errors
   - Network errors
   - Validation errors
   - User feedback

Return object with:
  - myShows, watchedEpisodes, isLoading, error
  - Functions: addShow, removeShow, markEpisodeWatched, etc.

Use useCallback for functions.
Use useReducer for complex state.
Include proper TypeScript types.
Add optimistic updates (show change immediately).
Handle concurrent requests.
```

---

## 🚀 BLOCK 7: COMPLETE FEATURES

### Prompt 7.1: Search Shows Feature

```
Create complete search shows functionality:

Requirements:
1. API Endpoint (FastAPI):
   - GET /api/shows/search?q={query}&page={page}
   - Calls TMDb search endpoint via tmdb_client
   - Returns paginated results (max 10 per page)
   - Includes pagination info

2. React Component:
   - SearchBar component (from Block 5.3)
   - Uses useShows hook
   - Displays results as ShowCard components
   - Handles add/remove actions
   - Shows loading states
   - Error messages

3. Features:
   - Real-time search with debounce
   - Pagination (previous/next)
   - Display TMDb rating
   - Show "Add to watchlist" button
   - Show if already in user's list
   - Mobile responsive

4. Pydantic models:
   - ShowSearchResult
   - SearchResponse with results[], page, total_pages

5. Error handling:
   - No results message
   - API errors
   - Network errors
   - Rate limit handling

Integrate with existing code.
Use TypeScript for React.
Add proper error boundaries.
Optimize re-renders.
```

### Prompt 7.2: Dashboard Page

```
Create dashboard page for authenticated users:

Requirements:
1. React Page component showing:
   - User profile (name, picture from Google)
   - Quick stats:
     * Shows in watchlist
     * Episodes watched
     * Hours watched (estimated)
     * Favorite genre
   - "Continue watching" section
     * Shows next episode for each in-progress show
     * Latest show added
     * Completed shows count
   - Recent activity
     * Last 5 episodes marked watched
   - Recommendations
     * 5-10 recommended shows based on watched genres

2. Layout:
   - Top: User profile header
   - Middle: Grid of stats (4 cards)
   - Bottom: 3 columns
     * Left: Continue watching
     * Center: Recent activity
     * Right: Recommendations

3. Features:
   - Click "Continue" to jump to next episode
   - Click show to open show detail page
   - Responsive design (stack on mobile)
   - Loading skeletons while fetching
   - Refresh button

4. API calls:
   - GET /api/user/shows
   - GET /api/user/stats
   - GET /api/recommendations
   - GET /api/user/activity

5. Styling:
   - Use Tailwind CSS
   - Card-based layout
   - Clear hierarchy
   - Good spacing

Use useShows hook.
Use useAuth for user data.
Handle loading states.
Add error boundaries.
Responsive grid layout.
```

---

## 🎯 BLOCK 8: BEST PRACTICES

### Prompt 8.1: Error Handling & Validation

```
Add comprehensive error handling to FastAPI app:

Requirements:
1. Custom exception classes:
   - AppException (base)
   - AuthenticationError (401)
   - AuthorizationError (403)
   - NotFoundError (404)
   - ValidationError (422)
   - RateLimitError (429)
   - ServerError (500)

2. Exception handlers:
   - @app.exception_handler(AppException)
   - Returns proper HTTP status codes
   - Includes error message (but not sensitive data)
   - Logs full error for debugging
   - Returns JSON with error structure

3. Validation:
   - Pydantic models validate input
   - Custom validators for business logic
   - Query parameter validation
   - Path parameter validation
   - Request body validation

4. Response schemas:
   - SuccessResponse with data
   - ErrorResponse with error message
   - PaginationResponse with page info

5. Logging:
   - Use Python logging module
   - Log level: DEBUG, INFO, WARNING, ERROR
   - Include request ID for tracing
   - Log API calls to external services
   - Sanitize sensitive data

Include docstrings.
Type hints for all functions.
Proper HTTP status codes.
User-friendly error messages.
```

### Prompt 8.2: Performance Optimization

```
Add performance optimizations to ShowTracker:

Requirements:
1. Database optimization:
   - Add proper indexes to D1:
     * idx_user_shows_user_id
     * idx_episodes_user_show
     * idx_shows_title
   - Batch operations for inserts
   - Use SELECT specific columns (not *)
   - Avoid N+1 queries

2. API optimizations:
   - Response caching with Cloudflare KV
   - Cache trending shows (1 day)
   - Cache user recommendations (7 days)
   - Cache show details (7 days)
   - Use cache-control headers

3. Frontend optimizations:
   - Code splitting (lazy load pages)
   - Image optimization
   - Minimize bundle size
   - Memoize expensive components
   - Virtual scrolling for long lists

4. Cloudflare optimizations:
   - Enable Workers KV caching
   - Set cache headers
   - Use edge caching
   - Enable compression

5. Monitoring:
   - Track API response times
   - Monitor error rates
   - Alert on performance degradation

Include specific code examples.
Show before/after metrics.
Add comments explaining optimizations.
```

---

## ✅ USAGE INSTRUCTIONS

### Step 1: Copy Prompt
- Find relevant prompt in this file
- Copy entire prompt block (including backticks)

### Step 2: Adjust for Your Needs
- Replace YOUR_VAR with actual values
- Adjust requirements if needed
- Add specific style preferences

### Step 3: Paste to AI
- Open Claude.ai or ChatGPT
- Paste prompt into chat
- Send message

### Step 4: Get Code
- AI will generate complete code
- Copy into your project
- Integrate with existing code

### Step 5: Test
- Run FastAPI: `uvicorn main:app --reload`
- Test frontend: `npm run dev`
- Verify functionality

### Step 6: Move to Next
- Pick next prompt
- Repeat process

---

## 📝 PROMPT TIPS

**For better results:**
- Be specific about requirements
- Include all constraints
- Ask for type hints
- Request docstrings
- Ask for error handling
- Request logging
- Ask for unit test examples
- Request performance considerations

**Customize prompts:**
- Add your specific API endpoints
- Include your design requirements
- Specify your coding standards
- Add team preferences
- Include security requirements

---

## 🎨 RECOMMENDED PROMPT ORDER

```
1. Block 1.1 - FastAPI Setup
2. Block 1.2 - Wrangler Config
3. Block 2.1 - OAuth Implementation
4. Block 2.2 - User Management
5. Block 3.1 - TMDb Client
6. Block 3.2 - Show Caching
7. Block 4.1 - Episode Tracking
8. Block 4.2 - Progress Calculation
9. Block 5.1 - ShowCard Component
10. Block 5.2 - EpisodeGrid Component
11. Block 5.3 - SearchBar Component
12. Block 6.1 - Auth Hook
13. Block 6.2 - Shows Hook
14. Block 7.1 - Search Feature
15. Block 7.2 - Dashboard Page
16. Block 8.1 - Error Handling
17. Block 8.2 - Performance
```

**Total effort**: ~6-8 hours of AI-assisted coding  
**Result**: Complete production-ready app

---

## 🚀 READY TO CODE?

1. Pick your first prompt (recommend Block 1.1)
2. Copy it
3. Paste to Claude/ChatGPT
4. Get code in seconds
5. Integrate & test
6. Move to next prompt

**Good luck! 🎉**

