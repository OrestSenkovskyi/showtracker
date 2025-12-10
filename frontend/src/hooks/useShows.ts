import { useState, useCallback } from 'react'
import api from '../api/client'

export interface ShowSearchResult {
  id: number
  name: string
  overview: string | null
  poster_path: string | null
  first_air_date: string | null
  vote_average: number | null
}

export interface UserShow {
  show_id: number
  title: string
  poster_path: string | null
  status: string
  favorite: boolean
  total_episodes: number
  watched_episodes?: number
  percentage?: number
}

export function useShowSearch() {
  const [results, setResults] = useState<ShowSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const search = useCallback(async (query: string, pageNum = 1) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await api.searchShows(query, pageNum)
      setResults(data.results)
      setPage(data.page)
      setTotalPages(data.total_pages)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearResults = useCallback(() => {
    setResults([])
    setPage(1)
    setTotalPages(0)
  }, [])

  return {
    results,
    isLoading,
    error,
    page,
    totalPages,
    search,
    clearResults,
  }
}

export function useUserShows() {
  const [shows, setShows] = useState<UserShow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShows = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await api.getUserShows()
      setShows(data.shows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shows')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addShow = useCallback(async (showId: number) => {
    try {
      await api.addShowToList(showId)
      await fetchShows() // Refresh list
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add show')
      return false
    }
  }, [fetchShows])

  const removeShow = useCallback(async (showId: number) => {
    try {
      await api.removeShowFromList(showId)
      setShows(prev => prev.filter(s => s.show_id !== showId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove show')
      return false
    }
  }, [])

  const updateStatus = useCallback(async (showId: number, status: string) => {
    try {
      await api.updateShowStatus(showId, status)
      setShows(prev =>
        prev.map(s => (s.show_id === showId ? { ...s, status } : s))
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
      return false
    }
  }, [])

  return {
    shows,
    isLoading,
    error,
    fetchShows,
    addShow,
    removeShow,
    updateStatus,
  }
}
