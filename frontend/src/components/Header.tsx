import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Header() {
  const { isAuthenticated, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path ? 'text-primary-600 font-semibold' : 'text-gray-600 hover:text-gray-900'

  if (!isAuthenticated) {
    return (
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-xl font-bold text-primary-600">
            ShowTracker
          </Link>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-primary-600">
          ShowTracker
        </Link>

        <nav className="flex items-center gap-6">
          <Link to="/" className={`transition-colors ${isActive('/')}`}>
            Dashboard
          </Link>
          <Link to="/search" className={`transition-colors ${isActive('/search')}`}>
            Search
          </Link>
          <button
            onClick={logout}
            className="text-gray-600 hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  )
}
