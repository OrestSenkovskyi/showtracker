import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import ShowCard from '../components/ShowCard'
import ProgressBar from '../components/ProgressBar'

interface ShowProgress {
  show_id: number
  title: string
  total_episodes: number
  watched_episodes: number
  percentage: number
  status: string
  poster_path?: string
}

export default function Dashboard() {
  const [shows, setShows] = useState<ShowProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    setIsLoading(true)
    try {
      const data = await api.getAllProgress()
      // Also get poster paths from user shows
      const userShows = await api.getUserShows()
      const posterMap = new Map(
        userShows.shows.map((s) => [s.show_id, s.poster_path])
      )
      const showsWithPosters = data.shows.map((s) => ({
        ...s,
        poster_path: posterMap.get(s.show_id) || null,
      }))
      setShows(showsWithPosters)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredShows = shows.filter((show) => {
    if (filter === 'all') return true
    return show.status === filter
  })

  const stats = {
    total: shows.length,
    watching: shows.filter((s) => s.status === 'watching').length,
    completed: shows.filter((s) => s.status === 'completed').length,
    episodesWatched: shows.reduce((sum, s) => sum + s.watched_episodes, 0),
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={loadProgress} className="btn btn-primary">
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Shows</h1>
        <Link to="/search" className="btn btn-primary">
          + Add Show
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Shows</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-blue-600">{stats.watching}</div>
          <div className="text-sm text-gray-500">Watching</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-sm text-gray-500">Completed</div>
        </div>
        <div className="card text-center">
          <div className="text-3xl font-bold text-purple-600">{stats.episodesWatched}</div>
          <div className="text-sm text-gray-500">Episodes Watched</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'watching', 'completed', 'paused', 'dropped'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === status
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Shows Grid */}
      {filteredShows.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">
            {filter === 'all'
              ? "You haven't added any shows yet."
              : `No shows with status "${filter}".`}
          </p>
          {filter === 'all' && (
            <Link to="/search" className="btn btn-primary">
              Search for Shows
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredShows.map((show) => (
            <ShowCard
              key={show.show_id}
              id={show.show_id}
              title={show.title}
              posterPath={show.poster_path || null}
              showActions={false}
              progress={{
                watched: show.watched_episodes,
                total: show.total_episodes,
                percentage: show.percentage,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
