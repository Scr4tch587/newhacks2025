import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const { user, role, loading } = useAuth()

  return (
    <div className="max-w-5xl mx-auto p-4">
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold text-gray-900">Welcome to Waypost</h1>
        <p className="mt-3 text-gray-600 text-lg">
          Discover, donate, and do good. Earn and redeem points while helping the community.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link to="/dashboard" className="px-5 py-3 rounded bg-indigo-600 text-white hover:bg-indigo-700">Explore Listings</Link>
          <Link to="/donate" className="px-5 py-3 rounded border hover:bg-gray-50">Donate an Item</Link>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900">Tourists</h3>
          <p className="text-sm text-gray-600 mt-1">Find items nearby and track your impact.</p>
          <Link to="/signup" className="inline-block mt-3 text-indigo-600 hover:underline">Create account</Link>
        </div>
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900">Businesses</h3>
          <p className="text-sm text-gray-600 mt-1">List items, schedule pickups, and earn points.</p>
          <Link to="/signup" className="inline-block mt-3 text-indigo-600 hover:underline">Become a partner</Link>
        </div>
        <div className="bg-white border rounded-lg p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900">Retailers</h3>
          <p className="text-sm text-gray-600 mt-1">Scan items, award points, and grow your profile.</p>
          <Link to="/signup" className="inline-block mt-3 text-indigo-600 hover:underline">Join the network</Link>
        </div>
      </section>

      {!loading && user && (
        <section className="mt-12 bg-indigo-50 border border-indigo-100 rounded-lg p-4">
          <div className="text-sm text-indigo-900">
            You are signed in as <span className="font-medium">{user.displayName || user.email}</span>
            {role ? <> with role <span className="font-medium">{role}</span></> : null}.
            <span className="ml-2">
              Go to {role === 'business' ? (
                <Link to="/business-dashboard" className="underline">Business Dashboard</Link>
              ) : (
                <Link to="/dashboard" className="underline">Dashboard</Link>
              )}
            </span>
          </div>
        </section>
      )}
    </div>
  )
}
