import { useEffect, useState } from 'react'

// ===== PLACEHOLDERS: replace these with your own images/SVGs =====
const SkyPlaceholder = () => (
  <div className="w-full h-full bg-sky-200 flex items-center justify-center text-sky-600 text-2xl">
    <img src="/newhacks2025-1/frontend/src/images/sky.jpg" alt="Sky" className="w-full h-full object-cover" />
  </div>
)

const MountainsPlaceholder = () => (
  <div className="w-full h-full bg-green-200 flex items-center justify-center text-green-700 text-2xl">
    Mountains Image Here
  </div>
)

const TreesBackgroundPlaceholder = () => (
  <div className="w-full h-full bg-emerald-200 flex items-center justify-center text-emerald-700 text-2xl">
    Background Trees
  </div>
)

const TreesForegroundPlaceholder = () => (
  <div className="w-full h-full bg-emerald-400/70 rounded-xl p-6 text-white text-2xl shadow-lg">
    Foreground Trees (in front of card)
  </div>
)

// ===== MAIN PAGE =====
export default function PointsPage() {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  // constants (replace with backend later)
  const points = 472
  const goal = 500
  const progress = Math.min((points / goal) * 100, 100)

  // animate bar
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 300)
    return () => clearTimeout(timer)
  }, [progress])

  // listen for scroll
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="relative min-h-[200vh] bg-gradient-to-b from-sky-100 via-emerald-50 to-emerald-100 overflow-hidden">
      {/* === PARALLAX BACKGROUND === */}
      <ParallaxLayer speed={0.2} zIndex={-10}><SkyPlaceholder /></ParallaxLayer>
      <ParallaxLayer speed={0.4} zIndex={-5}><MountainsPlaceholder /></ParallaxLayer>
      <ParallaxLayer speed={0.6} zIndex={-2}><TreesBackgroundPlaceholder /></ParallaxLayer>

      {/* === MAIN CONTENT === */}
      <div className="relative z-[5] flex flex-col items-center py-20 px-4">
        <div className="w-full max-w-2xl bg-[#FEF9E7] rounded-3xl shadow-lg p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col items-center">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">My Points 🌍</h1>
            <div className="text-7xl font-extrabold text-gray-900">{points}</div>
            <p className="text-gray-700 mt-2 text-lg font-medium">
              Earn points for sustainable adventures ✈️
            </p>
          </div>

          {/* Progress Bar */}
          <div>
            <p className="font-bold text-gray-900 mb-2 text-lg text-center">🌿 Eco Explorer Tier</p>
            <div className="relative w-full h-10 bg-emerald-100 rounded-full overflow-hidden border-2 border-emerald-300 shadow-inner">
              <div
                className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out bg-gradient-to-r from-teal-400 via-green-400 to-emerald-400 shadow-lg"
                style={{ width: `${animatedProgress}%` }}
              >
                {/* Shine */}
                <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.45)_40%,rgba(255,255,255,0)_80%)] animate-[shine_2s_infinite]" />
              </div>
            </div>
            <p className="text-md text-gray-800 mt-2 font-medium text-center">
              {goal - points} more → Next Tier 🌱
            </p>
          </div>

          {/* Redeem */}
          <div>
            <h2 className="text-2xl font-extrabold mb-6 text-gray-900 text-center">Redeem Experiences 🗺️</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
              {[
                { name: 'National Park Entry', cost: 500, icon: '🏞️' },
                { name: 'Tree Planting Event', cost: 800, icon: '🌳' },
                { name: 'Local Eco Tour', cost: 1500, icon: '🚲' },
                { name: 'Wildlife Sanctuary Visit', cost: 2000, icon: '🐘' },
              ].map((item) => (
                <div
                  key={item.name}
                  className="bg-gradient-to-b from-[#FDF6EC] to-[#F9EFD8] rounded-2xl shadow-md p-6 flex flex-col items-center justify-center border-2 border-[#F5E7C5] hover:scale-105 hover:shadow-lg transition-transform duration-300 ease-out"
                >
                  <div className="w-20 h-20 bg-white rounded-full mb-3 flex items-center justify-center text-4xl shadow-inner">
                    {item.icon}
                  </div>
                  <p className="font-bold text-gray-800 text-center">{item.name}</p>
                  <p className="text-sm text-gray-700 font-medium">{item.cost} pts</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Foreground trees over the card */}
        <div className="absolute bottom-0 z-[10]">
          <TreesForegroundPlaceholder />
        </div>
      </div>
    </div>
  )

  // === PARALLAX LAYER HELPER ===
  function ParallaxLayer({ speed, children, zIndex }) {
    return (
      <div
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translateY(${scrollY * speed}px)`,
          zIndex,
        }}
      >
        {children}
      </div>
    )
  }
}
