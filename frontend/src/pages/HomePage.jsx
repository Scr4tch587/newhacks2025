import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function HomePage() {
  const { user, role, loading } = useAuth()

  return (
    <div className="w-full h-full overflow-x-hidden">
      {/* Section 1 - Hero Video */}
      <section className="relative h-screen flex items-center justify-center text-center text-white">
        <video
          autoPlay
          loop
          muted
          playsInline
          src="/videos/hero.mp4"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 max-w-3xl px-4">
          <h1 className="text-5xl font-bold drop-shadow-lg">Welcome to Waypost</h1>
          <p className="mt-4 text-lg drop-shadow-md">
            Discover, donate, and do good. Earn and redeem points while helping the community.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link to="/dashboard" className="px-6 py-3 rounded-lg bg-[#D2B48C] text-white hover:bg-[#C19A6B] shadow-lg">
  Explore Listings
</Link>

            <Link to="/donate" className="px-6 py-3 rounded-lg border border-white/70 bg-white/20 backdrop-blur-sm hover:bg-white/40 shadow">
              Donate an Item
            </Link>
          </div>
        </div>
      </section>

      {/* Section 2 - Tourists Video */}
      <section className="relative h-screen flex items-center justify-center text-center text-white">
        <video
          autoPlay
          loop
          muted
          playsInline
          src="/videos/tourists.mp4"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold drop-shadow-lg">Tourists</h2>
          <p className="mt-3 text-lg drop-shadow-md">Find items nearby and track your impact as you travel.</p>
          <Link to="/signup" className="mt-4 inline-block text-[#D2B48C] hover:text-white underline">
  Create account
</Link>

        </div>
      </section>

      {/* Section 3 - Businesses Video */}
      <section className="relative h-screen flex items-center justify-center text-center text-white">
        <video
          autoPlay
          loop
          muted
          playsInline
          src="/videos/business.mp4"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold drop-shadow-lg">Businesses</h2>
          <p className="mt-3 text-lg drop-shadow-md">List items, schedule pickups, and earn points with ease.</p>
          <Link to="/signup" className="mt-4 inline-block text-[#D2B48C] hover:text-white underline">
  Become a partner
</Link>

        </div>
      </section>

      {/* Section 4 - Retailers Video */}
      <section className="relative h-screen flex items-center justify-center text-center text-white">
        <video
          autoPlay
          loop
          muted
          playsInline
          src="/videos/retailers.mp4"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold drop-shadow-lg">Retailers</h2>
          <p className="mt-3 text-lg drop-shadow-md">Scan items, award points, and grow your profile in the network.</p>
          <Link to="/signup" className="mt-4 inline-block text-[#D2B48C] hover:text-white underline">
  Join the network
</Link>

        </div>
      </section>

      {/* Section 5 - Signed in */}
      {!loading && user && (
        <section className="relative h-screen flex items-center justify-center text-center bg-gradient-to-b from-indigo-50 to-indigo-100">
          <div className="relative z-10 max-w-lg">
            <div className="text-sm text-indigo-900">
              You are signed in as <span className="font-medium">{user.displayName || user.email}</span>
              {role ? <> with role <span className="font-medium">{role}</span></> : null}.
              <div className="mt-2">
                Go to {role === 'business' ? (
                  <Link to="/business-dashboard" className="underline">Business Dashboard</Link>
                ) : (
                  <Link to="/dashboard" className="underline">Dashboard</Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
