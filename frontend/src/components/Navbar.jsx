import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
//import { signInWithGoogle, signOutUser, subscribeAuth } from '../utils/FirebaseAuth'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  return (
    <nav className="w-full bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-xl font-semibold">Waypost</Link>
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="text-gray-700 hover:text-black">Dashboard</Link>
          <Link to="/points" className="text-gray-700 hover:text-black">Points</Link>
          <Link to="/donate" className="text-gray-700 hover:text-black">Donate Item</Link>
          {user ? (
            <button className="px-3 py-1.5 rounded bg-gray-900 text-white hover:bg-black">Logout</button>
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
