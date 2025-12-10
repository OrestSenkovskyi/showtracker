import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useShowSearch, useUserShows } from './useShows'
import api from '../api/client'

// Mock the api module
vi.mock('../api/client', () => ({
  default: {
    searchShows: vi.fn(),
    getUserShows: vi.fn(),
    addShowToList: vi.fn(),
    removeShowFromList: vi.fn(),
    updateShowStatus: vi.fn(),
  },
}))

describe('useShowSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty results', () => {
    const { result } = renderHook(() => useShowSearch())

    expect(result.current.results).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.page).toBe(1)
    expect(result.current.totalPages).toBe(0)
  })

  it('searches for shows successfully', async () => {
    const mockResults = {
      results: [
        { id: 1, name: 'Breaking Bad', overview: 'A teacher', poster_path: '/bb.jpg', first_air_date: '2008', vote_average: 9.5 },
      ],
      page: 1,
      total_pages: 5,
    }
    vi.mocked(api.searchShows).mockResolvedValue(mockResults)

    const { result } = renderHook(() => useShowSearch())

    await act(async () => {
      await result.current.search('Breaking Bad')
    })

    expect(api.searchShows).toHaveBeenCalledWith('Breaking Bad', 1)
    expect(result.current.results).toEqual(mockResults.results)
    expect(result.current.page).toBe(1)
    expect(result.current.totalPages).toBe(5)
    expect(result.current.isLoading).toBe(false)
  })

  it('clears results for empty query', async () => {
    const { result } = renderHook(() => useShowSearch())

    await act(async () => {
      await result.current.search('   ')
    })

    expect(api.searchShows).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })

  it('handles search error', async () => {
    vi.mocked(api.searchShows).mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useShowSearch())

    await act(async () => {
      await result.current.search('test')
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.results).toEqual([])
  })

  it('clears results with clearResults', async () => {
    const mockResults = { results: [{ id: 1, name: 'Test' }], page: 2, total_pages: 3 }
    vi.mocked(api.searchShows).mockResolvedValue(mockResults)

    const { result } = renderHook(() => useShowSearch())

    await act(async () => {
      await result.current.search('test')
    })

    expect(result.current.results.length).toBe(1)

    act(() => {
      result.current.clearResults()
    })

    expect(result.current.results).toEqual([])
    expect(result.current.page).toBe(1)
    expect(result.current.totalPages).toBe(0)
  })
})

describe('useUserShows', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty shows', () => {
    const { result } = renderHook(() => useUserShows())

    expect(result.current.shows).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetches user shows successfully', async () => {
    const mockShows = {
      shows: [
        { show_id: 1, title: 'Breaking Bad', poster_path: '/bb.jpg', status: 'watching', favorite: true, total_episodes: 62, total_seasons: 5 },
      ],
    }
    vi.mocked(api.getUserShows).mockResolvedValue(mockShows)

    const { result } = renderHook(() => useUserShows())

    await act(async () => {
      await result.current.fetchShows()
    })

    expect(result.current.shows).toEqual(mockShows.shows)
    expect(result.current.isLoading).toBe(false)
  })

  it('adds show to list', async () => {
    vi.mocked(api.addShowToList).mockResolvedValue({})
    vi.mocked(api.getUserShows).mockResolvedValue({ shows: [] })

    const { result } = renderHook(() => useUserShows())

    await act(async () => {
      const success = await result.current.addShow(123)
      expect(success).toBe(true)
    })

    expect(api.addShowToList).toHaveBeenCalledWith(123)
    expect(api.getUserShows).toHaveBeenCalled()
  })

  it('removes show from list', async () => {
    vi.mocked(api.removeShowFromList).mockResolvedValue({})
    vi.mocked(api.getUserShows).mockResolvedValue({
      shows: [{ show_id: 1, title: 'Test', poster_path: null, status: 'watching', favorite: false, total_episodes: 10, total_seasons: 1 }],
    })

    const { result } = renderHook(() => useUserShows())

    await act(async () => {
      await result.current.fetchShows()
    })

    await act(async () => {
      const success = await result.current.removeShow(1)
      expect(success).toBe(true)
    })

    expect(api.removeShowFromList).toHaveBeenCalledWith(1)
    expect(result.current.shows).toEqual([])
  })

  it('updates show status', async () => {
    vi.mocked(api.updateShowStatus).mockResolvedValue({})
    vi.mocked(api.getUserShows).mockResolvedValue({
      shows: [{ show_id: 1, title: 'Test', poster_path: null, status: 'watching', favorite: false, total_episodes: 10, total_seasons: 1 }],
    })

    const { result } = renderHook(() => useUserShows())

    await act(async () => {
      await result.current.fetchShows()
    })

    await act(async () => {
      const success = await result.current.updateStatus(1, 'completed')
      expect(success).toBe(true)
    })

    expect(api.updateShowStatus).toHaveBeenCalledWith(1, 'completed')
    expect(result.current.shows[0].status).toBe('completed')
  })

  it('handles fetch error', async () => {
    vi.mocked(api.getUserShows).mockRejectedValue(new Error('Fetch failed'))

    const { result } = renderHook(() => useUserShows())

    await act(async () => {
      await result.current.fetchShows()
    })

    expect(result.current.error).toBe('Fetch failed')
  })
})
