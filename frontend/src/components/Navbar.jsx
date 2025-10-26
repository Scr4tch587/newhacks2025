import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signOutUser } from '../utils/FirebaseAuth'

export default function Navbar() {
  const { user, role } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOutUser()
      navigate('/login')
    } catch (e) {
      console.error('Logout failed', e)
    }
  }

  return (
    <nav className="w-full bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
  <Link to="/" className="text-xl font-semibold">Waypost</Link>
        <div className="flex items-center gap-4">
          {role === 'business' ? (
            // Business users: only Business Dashboard
            <Link to="/business-dashboard" className="text-gray-700 hover:text-black">Business Dashboard</Link>
          ) : role === 'retailer' ? (
            // Retailers: only Retail Dashboard
            <Link to="/retail-dashboard" className="text-gray-700 hover:text-black">Retail Dashboard</Link>
          ) : (
            // Tourists and unknown roles: show Dashboard/Points, and Donate for tourists
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-black">Dashboard</Link>
              <Link to="/points" className="text-gray-700 hover:text-black">Points</Link>
              {role === 'tourist' && (
                <Link to="/donate" className="text-gray-700 hover:text-black">Donate Item</Link>
              )}
            </>
          )}
          {user ? (
            <>
              <span className="text-sm text-gray-700 mr-2">Hi, {user.displayName || user.email}</span>
              <button onClick={handleLogout} className="px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-black">Logout</button>
            </>
          ) : (
            <Link to="/login" className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">
              Login
            </Link>

          )}
        </div>
      </div>
    </nav>
  )
}
