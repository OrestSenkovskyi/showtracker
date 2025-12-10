const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Try to load token from localStorage on init
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('auth_token', token)
    } else {
      localStorage.removeItem('auth_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async getLoginUrl(): Promise<{ url: string }> {
    return this.request('/api/auth/login')
  }

  // Shows endpoints
  async searchShows(query: string, page = 1) {
    return this.request<{
      results: Array<{
        id: number
        name: string
        overview: string | null
        poster_path: string | null
        first_air_date: string | null
        vote_average: number | null
      }>
      page: number
      total_pages: number
      total_results: number
    }>(`/api/shows/search?q=${encodeURIComponent(query)}&page=${page}`)
  }

  async getTrendingShows(timeWindow: 'day' | 'week' = 'week') {
    return this.request<{ results: unknown[] }>(`/api/shows/trending?time_window=${timeWindow}`)
  }

  async getShowDetails(showId: number) {
    return this.request<{
      id: number
      title?: string
      name?: string
      overview: string
      poster_path: string | null
      backdrop_path: string | null
      total_episodes: number
      total_seasons: number
      genres: string
      tmdb_rating: number
    }>(`/api/shows/${showId}`)
  }

  async getSeasonDetails(showId: number, seasonNumber: number) {
    return this.request<{
      episodes: Array<{
        episode_number: number
        name: string
        overview: string
        air_date: string
      }>
    }>(`/api/shows/${showId}/seasons/${seasonNumber}`)
  }

  async addShowToList(showId: number, status = 'watching', favorite = false) {
    return this.request('/api/shows/add', {
      method: 'POST',
      body: { show_id: showId, status, favorite },
    })
  }

  async getUserShows() {
    return this.request<{
      shows: Array<{
        show_id: number
        title: string
        poster_path: string | null
        status: string
        favorite: boolean
        total_episodes: number
        total_seasons: number
      }>
    }>('/api/shows/user/list')
  }

  async updateShowStatus(showId: number, status: string) {
    return this.request(`/api/shows/${showId}/status?status=${status}`, {
      method: 'PATCH',
    })
  }

  async removeShowFromList(showId: number) {
    return this.request(`/api/shows/${showId}`, { method: 'DELETE' })
  }

  // Episodes endpoints
  async markEpisodeWatched(showId: number, season: number, episode: number) {
    return this.request('/api/episodes/mark-watched', {
      method: 'POST',
      body: { show_id: showId, season, episode },
    })
  }

  async unmarkEpisodeWatched(showId: number, season: number, episode: number) {
    return this.request('/api/episodes/unmark-watched', {
      method: 'DELETE',
      body: { show_id: showId, season, episode },
    })
  }

  async getWatchedEpisodes(showId: number) {
    return this.request<{
      show_id: number
      episodes: Array<{ season: number; episode: number; watched_at: string }>
    }>(`/api/episodes/show/${showId}`)
  }

  async getShowProgress(showId: number) {
    return this.request<{
      show_id: number
      watched: number
      total: number
      percentage: number
    }>(`/api/episodes/show/${showId}/progress`)
  }

  async getAllProgress() {
    return this.request<{
      shows: Array<{
        show_id: number
        title: string
        total_episodes: number
        watched_episodes: number
        percentage: number
        status: string
      }>
    }>('/api/episodes/progress')
  }

  async markSeasonWatched(showId: number, season: number, episodeCount: number) {
    return this.request('/api/episodes/mark-season-watched', {
      method: 'POST',
      body: { show_id: showId, season, episode_count: episodeCount },
    })
  }
}

export const api = new ApiClient(API_BASE_URL)
export default api
