import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signOutUser } from '../utils/FirebaseAuth'

// Import logo + airplane
import logo from '../images/logo.png'
import airplane from '../images/airplane.png' // replace with your airplane svg/png

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
    <nav className="relative w-full bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50 overflow-hidden">
      {/* Paper Airplane Animation */}
      <div className="airplane-wrapper absolute top-6 left-0 h-6 w-6">
  {/* Airplane itself */}
  <img
    src={airplane}
    alt="Airplane"
    className="h-6 w-6 animate-airplane-sine"
  />
  {/* Dashed fading trail */}
  <div className="airplane-trail"></div>
</div>


      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + Brand */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Waypost Logo" className="h-12 w-12 object-contain" />
          <span className="text-xl font-semibold">Waypost</span>
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-4">
          {role === 'business' ? (
            <Link to="/business-dashboard" className="text-gray-700 hover:text-black">Business Dashboard</Link>
          ) : role === 'retailer' ? (
            <Link to="/retail-dashboard" className="text-gray-700 hover:text-black">Retail Dashboard</Link>
          ) : (
            <>
              <Link to="/dashboard" className="text-gray-700 hover:text-black">Dashboard</Link>
              <Link to="/points" className="text-gray-700 hover:text-black">Points</Link>
              {role === 'tourist' && (
                <Link to="/donate" className="text-gray-700 hover:text-black">Donate</Link>
              )}
            </>
          )}
          {user ? (
            <>
              <span className="text-sm text-gray-700 mr-2">Hi, {user.displayName || user.email}</span>
              <button onClick={handleLogout} className="px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-black">Logout</button>
            </>
          ) : (
            <Link
  to="/login"
  className="px-3 py-1.5 rounded bg-[#D2B48C] text-white hover:bg-[#C19A6B]"
>
  Login
</Link>

          )}
        </div>
      </div>
    </nav>
  )
}
