import { useState } from 'react'

interface Episode {
  season: number
  episode: number
  name?: string
  air_date?: string
}

interface EpisodeGridProps {
  seasons: Array<{
    season_number: number
    episode_count: number
    episodes?: Episode[]
  }>
  watchedEpisodes: Set<string> // Set of "S01E01" format strings
  onToggleEpisode: (season: number, episode: number, watched: boolean) => void
  onMarkSeasonWatched?: (season: number, episodeCount: number) => void
}

function episodeKey(season: number, episode: number): string {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
}

export default function EpisodeGrid({
  seasons,
  watchedEpisodes,
  onToggleEpisode,
  onMarkSeasonWatched,
}: EpisodeGridProps) {
  const [expandedSeason, setExpandedSeason] = useState<number | null>(seasons[0]?.season_number || null)

  return (
    <div className="space-y-4">
      {seasons.map((season) => {
        const isExpanded = expandedSeason === season.season_number
        const episodeCount = season.episode_count || season.episodes?.length || 0
        const watchedInSeason = Array.from({ length: episodeCount }, (_, i) =>
          watchedEpisodes.has(episodeKey(season.season_number, i + 1))
        ).filter(Boolean).length

        return (
          <div key={season.season_number} className="card">
            <button
              onClick={() => setExpandedSeason(isExpanded ? null : season.season_number)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold">Season {season.season_number}</span>
                <span className="text-sm text-gray-500">
                  {watchedInSeason}/{episodeCount} watched
                </span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="mt-4">
                {onMarkSeasonWatched && (
                  <button
                    onClick={() => onMarkSeasonWatched(season.season_number, episodeCount)}
                    className="btn btn-secondary text-sm mb-4"
                  >
                    Mark all as watched
                  </button>
                )}

                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                  {Array.from({ length: episodeCount }, (_, i) => {
                    const epNum = i + 1
                    const key = episodeKey(season.season_number, epNum)
                    const isWatched = watchedEpisodes.has(key)

                    return (
                      <button
                        key={key}
                        onClick={() => onToggleEpisode(season.season_number, epNum, !isWatched)}
                        className={`
                          aspect-square rounded-lg flex items-center justify-center text-sm font-medium
                          transition-colors
                          ${isWatched
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        `}
                        title={`Episode ${epNum}`}
                      >
                        {epNum}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
