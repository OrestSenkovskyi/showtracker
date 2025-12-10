import { Link } from 'react-router-dom'

interface ShowCardProps {
  id: number
  title: string
  posterPath: string | null
  rating?: number | null
  year?: string | null
  onAdd?: () => void
  onRemove?: () => void
  showActions?: boolean
  progress?: {
    watched: number
    total: number
    percentage: number
  }
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w300'
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/300x450?text=No+Image'

export default function ShowCard({
  id,
  title,
  posterPath,
  rating,
  year,
  onAdd,
  onRemove,
  showActions = true,
  progress,
}: ShowCardProps) {
  const posterUrl = posterPath ? `${TMDB_IMAGE_BASE}${posterPath}` : PLACEHOLDER_IMAGE

  return (
    <div className="card group hover:shadow-md transition-shadow">
      <Link to={`/show/${id}`} className="block">
        <div className="relative overflow-hidden rounded-lg mb-3">
          <img
            src={posterUrl}
            alt={title}
            className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          {rating != null && (
            <div className="absolute top-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded-md">
              ⭐ {rating.toFixed(1)}
            </div>
          )}
        </div>
        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{title}</h3>
        {year && <p className="text-sm text-gray-500">{year}</p>}
      </Link>

      {progress && (
        <div className="mt-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>
              {progress.watched}/{progress.total}
            </span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {showActions && (onAdd || onRemove) && (
        <div className="mt-3 flex gap-2">
          {onAdd && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onAdd()
              }}
              className="btn btn-primary flex-1 text-sm"
            >
              + Add
            </button>
          )}
          {onRemove && (
            <button
              onClick={(e) => {
                e.preventDefault()
                onRemove()
              }}
              className="btn btn-secondary flex-1 text-sm"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}
