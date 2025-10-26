import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { signInWithEmail, getIdToken } from '../utils/FirebaseAuth'
import { getProfileWithToken } from '../utils/FastAPIClient'

// import your background layers
import sky from "../images/sky.png"
import mountains from "../images/mountains.png"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      const token = await getIdToken()
      navigate('/')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center">
      {/* === BACKGROUND WITH PARALLAX === */}
      <img
        src={sky}
        alt="Sky background"
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }}
      />
      <img
        src={mountains}
        alt="Mountains"
        className="absolute bottom-0 w-full object-cover z-10"
      />

      {/* === LOGIN BOX === */}
      <div className="relative z-30 bg-white p-8 rounded-2xl shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h1>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          Don’t have an account?{' '}
          <Link to="/signup" className="text-indigo-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
