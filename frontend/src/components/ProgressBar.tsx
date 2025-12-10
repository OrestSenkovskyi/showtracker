interface ProgressBarProps {
  watched: number
  total: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function ProgressBar({
  watched,
  total,
  showLabel = true,
  size = 'md',
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((watched / total) * 100) : 0

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size]

  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>
            {watched} / {total} episodes
          </span>
          <span>{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heightClass}`}>
        <div
          className={`bg-primary-500 ${heightClass} rounded-full transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
