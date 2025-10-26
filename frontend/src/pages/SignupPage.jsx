import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { signInWithEmail } from '../utils/FirebaseAuth'
import { registerTourist, registerBusiness, registerRetailer, getLoginProfileWithToken } from '../utils/FastAPIClient'
import { getIdToken } from '../utils/FirebaseAuth'

// import your background layers
import sky from "../images/sky.png"
import mountains from "../images/mountains.png"

export default function SignupPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('tourist') // 'tourist' | 'business' | 'retailer'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [address, setAddress] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
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
      if ((password || '').length < 6) {
        throw new Error('Password must be at least 6 characters')
      }
      if (role === 'tourist') {
        await registerTourist({ username, email, password })
      } else if (role === 'business') {
        if (!address) throw new Error('Please provide a location')
        await registerBusiness({ name: username, email, password, address })
      } else if (role === 'retailer') {
        if (!address) throw new Error('Please provide a location')
        await registerRetailer({ name: username, email, password, address })
      }
      await signInWithEmail(email, password)
      const token = await getIdToken()
      const profile = await getLoginProfileWithToken(token)
      console.log('Registered profile:', profile)
      navigate('/')
    } catch (err) {
      console.error('Signup failed:', err)
      const serverDetail = err?.response?.data?.detail
      setError(serverDetail || err.message || 'Failed to register')
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

      {/* === SIGNUP BOX === */}
      <div className="relative z-30 bg-white p-8 rounded-2xl shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</h1>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['tourist','business','retailer'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`py-2 rounded border ${role===r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Full Name"
            required
            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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
          {role !== 'tourist' && (
            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={async (e) => {
                  const val = e.target.value
                  setAddress(val)
                  if (!val || val.length < 3) { setSuggestions([]); return }
                  try {
                    setSuggestionLoading(true)
                    const q = encodeURIComponent(val)
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${q}`)
                    const json = await res.json()
                    setSuggestions(Array.isArray(json) ? json : [])
                  } catch (e) {
                    setSuggestions([])
                  } finally {
                    setSuggestionLoading(false)
                  }
                }}
                placeholder="Business/Retailer Location"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {suggestionLoading && <div className="text-xs text-gray-500 mt-1">Searching…</div>}
              {suggestions.length > 0 && (
                <ul className="absolute z-10 left-0 right-0 bg-white border rounded shadow max-h-48 overflow-auto mt-1">
                  {suggestions.map(s => (
                    <li
                      key={s.place_id}
                      onClick={() => { setAddress(s.display_name); setSuggestions([]) }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      {s.display_name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Creating…' : 'Sign Up'}
          </button>
          {error && <div className="text-sm text-red-600">{error}</div>}
        </form>

        <p className="text-sm text-center mt-4 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
