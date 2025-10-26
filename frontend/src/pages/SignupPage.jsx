import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { signInWithEmail } from '../utils/FirebaseAuth'
import { registerTourist, getProfileWithToken } from '../utils/FastAPIClient'
import { getIdToken } from '../utils/FirebaseAuth'

export default function SignupPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      // Call backend to create Firebase user and Firestore tourist doc
      await registerTourist({username, email, password})
      // Sign in client-side to obtain ID token
      await signInWithEmail(email, password)
      const token = await getIdToken()
      const profile = await getProfileWithToken(token)
      console.log('Registered profile:', profile)
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-md w-96">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</h1>

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
