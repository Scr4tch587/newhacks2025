import { useEffect, useState } from 'react'
import { signInWithGoogle, subscribeAuth } from '../utils/FirebaseAuth'

export default function LoginPage() {
  const [user, setUser] = useState(null)
  useEffect(() => subscribeAuth(setUser), [])

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-semibold">Welcome</h1>
      <p className="text-gray-600 mt-1">Sign in to continue</p>
      {user ? (
        <div className="mt-4">Logged in as <span className="font-medium">{user.email}</span></div>
      ) : (
        <button className="mt-6 w-full px-4 py-2 rounded bg-indigo-600 text-white" onClick={signInWithGoogle}>Sign in with Google</button>
      )}
    </div>
  )
}
