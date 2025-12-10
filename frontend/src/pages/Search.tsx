import { useState, useEffect } from 'react'
import SearchBar from '../components/SearchBar'
import ShowCard from '../components/ShowCard'
import { useShowSearch, useUserShows } from '../hooks/useShows'

export default function Search() {
  const { results, isLoading, error, search } = useShowSearch()
  const { shows: userShows, addShow, fetchShows } = useUserShows()
  const [addedShows, setAddedShows] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchShows()
  }, [fetchShows])

  useEffect(() => {
    // Track which shows are already in user's list
    const ids = new Set(userShows.map((s) => s.show_id))
    setAddedShows(ids)
  }, [userShows])

  const handleAdd = async (showId: number) => {
    const success = await addShow(showId)
    if (success) {
      setAddedShows((prev) => new Set(prev).add(showId))
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Shows</h1>

      <div className="mb-8">
        <SearchBar onSearch={search} isLoading={isLoading} />
      </div>

      {error && (
        <div className="card bg-red-50 border-red-200 text-red-700 mb-6">
          {error}
        </div>
      )}

      {results.length === 0 && !isLoading && (
        <div className="card text-center py-12 text-gray-500">
          Search for TV shows to add to your watchlist.
        </div>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {results.map((show) => {
            const isAdded = addedShows.has(show.id)
            return (
              <ShowCard
                key={show.id}
                id={show.id}
                title={show.name}
                posterPath={show.poster_path}
                rating={show.vote_average}
                year={show.first_air_date?.slice(0, 4)}
                onAdd={isAdded ? undefined : () => handleAdd(show.id)}
                showActions={!isAdded}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
