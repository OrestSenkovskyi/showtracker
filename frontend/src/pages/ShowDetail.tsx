import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/client'
import ProgressBar from '../components/ProgressBar'
import EpisodeGrid from '../components/EpisodeGrid'

interface ShowDetails {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  total_episodes: number
  total_seasons: number
  number_of_seasons?: number
  number_of_episodes?: number
  genres: string | Array<{ id: number; name: string }>
  tmdb_rating?: number
  vote_average?: number
  seasons?: Array<{
    season_number: number
    episode_count: number
    name: string
  }>
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

function episodeKey(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
}

export default function ShowDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [show, setShow] = useState<ShowDetails | null>(null)
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInList, setIsInList] = useState(false)

  const showId = id ? parseInt(id, 10) : 0

  const loadData = useCallback(async () => {
    if (!showId) return

    setIsLoading(true)
    setError(null)

    try {
      // Load show details
      const showData = await api.getShowDetails(showId)
      setShow(showData)

      // Check if in user's list and load watched episodes
      try {
        const watchedData = await api.getWatchedEpisodes(showId)
        const watchedSet = new Set(
          watchedData.episodes.map((e) => episodeKey(e.season, e.episode))
        )
        setWatchedEpisodes(watchedSet)
        setIsInList(true)
      } catch {
        // Not in list or not authenticated for this show
        setIsInList(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load show')
    } finally {
      setIsLoading(false)
    }
  }, [showId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAddToList = async () => {
    try {
      await api.addShowToList(showId)
      setIsInList(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add show')
    }
  }

  const handleRemoveFromList = async () => {
    try {
      await api.removeShowFromList(showId)
      setIsInList(false)
      setWatchedEpisodes(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove show')
    }
  }

  const handleToggleEpisode = async (season: number, episode: number, watched: boolean) => {
    const key = episodeKey(season, episode)

    // Optimistic update
    setWatchedEpisodes((prev) => {
      const next = new Set(prev)
      if (watched) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })

    try {
      if (watched) {
        await api.markEpisodeWatched(showId, season, episode)
      } else {
        await api.unmarkEpisodeWatched(showId, season, episode)
      }
    } catch {
      // Revert on error
      setWatchedEpisodes((prev) => {
        const next = new Set(prev)
        if (watched) {
          next.delete(key)
        } else {
          next.add(key)
        }
        return next
      })
    }
  }

  const handleMarkSeasonWatched = async (season: number, episodeCount: number) => {
    // Optimistic update
    const newWatched = new Set(watchedEpisodes)
    for (let i = 1; i <= episodeCount; i++) {
      newWatched.add(episodeKey(season, i))
    }
    setWatchedEpisodes(newWatched)

    try {
      await api.markSeasonWatched(showId, season, episodeCount)
    } catch {
      // Revert on error - reload data
      loadData()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error || !show) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500 mb-4">{error || 'Show not found'}</p>
        <button onClick={() => navigate(-1)} className="btn btn-secondary">
          Go Back
        </button>
      </div>
    )
  }

  const title = show.title || show.name || 'Unknown Show'
  const totalEpisodes = show.total_episodes || show.number_of_episodes || 0
  const totalSeasons = show.total_seasons || show.number_of_seasons || 0
  const rating = show.tmdb_rating || show.vote_average || 0
  const genres = typeof show.genres === 'string'
    ? show.genres
    : show.genres?.map((g) => g.name).join(', ') || ''

  // Build seasons array for EpisodeGrid
  const seasons = show.seasons
    ? show.seasons.filter((s) => s.season_number > 0) // Exclude specials
    : Array.from({ length: totalSeasons }, (_, i) => ({
        season_number: i + 1,
        episode_count: Math.ceil(totalEpisodes / totalSeasons),
        name: `Season ${i + 1}`,
      }))

  return (
    <div>
      {/* Backdrop */}
      {show.backdrop_path && (
        <div className="relative -mx-4 -mt-8 mb-8 h-64 overflow-hidden">
          <img
            src={`${TMDB_IMAGE_BASE}/w1280${show.backdrop_path}`}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-50 to-transparent" />
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="flex-shrink-0">
          <img
            src={
              show.poster_path
                ? `${TMDB_IMAGE_BASE}/w300${show.poster_path}`
                : 'https://via.placeholder.com/300x450?text=No+Image'
            }
            alt={title}
            className="w-48 rounded-xl shadow-lg mx-auto md:mx-0"
          />
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
            {rating > 0 && (
              <span className="flex items-center gap-1">
                ⭐ {rating.toFixed(1)}
              </span>
            )}
            <span>{totalSeasons} Seasons</span>
            <span>{totalEpisodes} Episodes</span>
          </div>

          {genres && (
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.split(',').map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                >
                  {genre.trim()}
                </span>
              ))}
            </div>
          )}

          <p className="text-gray-600 mb-6 line-clamp-4">{show.overview}</p>

          {/* Actions */}
          <div className="flex gap-3 mb-6">
            {isInList ? (
              <button onClick={handleRemoveFromList} className="btn btn-secondary">
                Remove from List
              </button>
            ) : (
              <button onClick={handleAddToList} className="btn btn-primary">
                + Add to List
              </button>
            )}
          </div>

          {/* Progress */}
          {isInList && (
            <div className="card">
              <h3 className="font-semibold mb-3">Progress</h3>
              <ProgressBar watched={watchedEpisodes.size} total={totalEpisodes} />
            </div>
          )}
        </div>
      </div>

      {/* Episode Grid */}
      {isInList && seasons.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Episodes</h2>
          <EpisodeGrid
            seasons={seasons}
            watchedEpisodes={watchedEpisodes}
            onToggleEpisode={handleToggleEpisode}
            onMarkSeasonWatched={handleMarkSeasonWatched}
          />
        </div>
      )}
    </div>
  )
}
