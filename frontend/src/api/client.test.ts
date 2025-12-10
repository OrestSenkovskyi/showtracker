import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// We need to import fresh module for each test since it creates singleton
let api: typeof import('./client').default

describe('ApiClient', () => {
  const mockFetch = vi.fn()

  beforeEach(async () => {
    vi.clearAllMocks()
    global.fetch = mockFetch

    // Reset localStorage mock
    vi.mocked(localStorage.getItem).mockReturnValue(null)
    vi.mocked(localStorage.setItem).mockClear()
    vi.mocked(localStorage.removeItem).mockClear()

    // Re-import to get fresh instance
    vi.resetModules()
    const module = await import('./client')
    api = module.default
  })

  describe('token management', () => {
    it('initializes with token from localStorage', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('stored-token')

      vi.resetModules()
      const module = await import('./client')
      api = module.default

      expect(api.getToken()).toBe('stored-token')
    })

    it('sets token and stores in localStorage', () => {
      api.setToken('new-token')

      expect(api.getToken()).toBe('new-token')
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'new-token')
    })

    it('removes token from localStorage when set to null', () => {
      api.setToken('some-token')
      api.setToken(null)

      expect(api.getToken()).toBeNull()
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token')
    })
  })

  describe('request handling', () => {
    it('makes GET request with correct headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: 'https://oauth.example.com' }),
      })

      await api.getLoginUrl()

      expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        body: undefined,
      })
    })

    it('includes Authorization header when token is set', async () => {
      api.setToken('test-token')
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [] }),
      })

      await api.searchShows('test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      )
    })

    it('throws error for non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ detail: 'Unauthorized' }),
      })

      await expect(api.getLoginUrl()).rejects.toThrow('Unauthorized')
    })

    it('handles JSON parse error in error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(api.getLoginUrl()).rejects.toThrow('Request failed')
    })
  })

  describe('searchShows', () => {
    it('encodes query parameter correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ results: [], page: 1, total_pages: 0, total_results: 0 }),
      })

      await api.searchShows('Game of Thrones', 2)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/shows/search?q=Game%20of%20Thrones&page=2',
        expect.any(Object)
      )
    })
  })

  describe('getShowDetails', () => {
    it('makes request to correct endpoint', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 123, name: 'Test Show' }),
      })

      await api.getShowDetails(123)

      expect(mockFetch).toHaveBeenCalledWith('/api/shows/123', expect.any(Object))
    })
  })

  describe('addShowToList', () => {
    it('makes POST request with correct body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.addShowToList(123, 'watching', true)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/shows/add',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ show_id: 123, status: 'watching', favorite: true }),
        })
      )
    })

    it('uses default values for status and favorite', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.addShowToList(123)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/shows/add',
        expect.objectContaining({
          body: JSON.stringify({ show_id: 123, status: 'watching', favorite: false }),
        })
      )
    })
  })

  describe('markEpisodeWatched', () => {
    it('makes POST request with episode data', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.markEpisodeWatched(123, 2, 5)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/episodes/mark-watched',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ show_id: 123, season: 2, episode: 5 }),
        })
      )
    })
  })

  describe('removeShowFromList', () => {
    it('makes DELETE request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      })

      await api.removeShowFromList(123)

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/shows/123',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('getShowProgress', () => {
    it('fetches progress for specific show', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ show_id: 1, watched: 5, total: 10, percentage: 50 }),
      })

      const result = await api.getShowProgress(1)

      expect(mockFetch).toHaveBeenCalledWith('/api/episodes/show/1/progress', expect.any(Object))
      expect(result.percentage).toBe(50)
    })
  })
})
