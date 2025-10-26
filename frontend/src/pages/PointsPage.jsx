import { useEffect, useState } from "react";

// Import your images
import sky from "../images/sky.png";
import mountains from "../images/mountains.png";
// import trees from "../images/trees.png";

export default function PointsPage() {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // constants (replace with backend later)
  const points = 472;
  const goal = 500;
  const progress = Math.min((points / goal) * 100, 100);

  // animate bar
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 300);
    return () => clearTimeout(timer);
  }, [progress]);

  // track scroll position for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center py-12 px-4 font-cartoon overflow-hidden">
      {/* === BACKGROUND LAYERS === */}
      {/* Sky */}
      <img
        src={sky}
        alt="Sky background"
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ transform: `translateY(${scrollY * 0.2}px)` }} // subtle movement
      />

      {/* Mountains */}
      <img
        src={mountains}
        alt="Mountains"
        className="absolute bottom-0 w-full object-cover z-10"
        style={{ transform: `translateY(${scrollY * 0.5}px)` }} // moves faster
      />

      {/* Trees (later) */}
      {/* <img
        src={trees}
        alt="Trees"
        className="absolute bottom-0 w-full object-cover z-20"
        style={{ transform: `translateY(${scrollY * 0.8}px)` }}
      /> */}

      {/* === POINTS CONTAINER === */}
      <div className="relative z-30 w-full max-w-2xl bg-[#FEF9E7] rounded-3xl shadow-lg p-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            My Points 🌍
          </h1>
          <div className="text-7xl font-extrabold text-gray-900">{points}</div>
          <p className="text-gray-700 mt-2 text-lg font-medium">
            Earn points for sustainable adventures ✈️
          </p>
        </div>

        {/* Progress Bar */}
        <div>
          <p className="font-bold text-gray-900 mb-2 text-lg text-center">
            🌿 Eco Explorer Tier
          </p>
          <div className="relative w-full h-8 bg-emerald-100 rounded-full overflow-hidden border-2 border-emerald-300 shadow-inner">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-1000 ease-out"
              style={{ width: `${animatedProgress}%` }}
            />
            {/* Shine effect */}
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.4)_40%,rgba(255,255,255,0)_80%)] animate-[shine_2s_infinite]" />
          </div>
          <p className="text-md text-gray-800 mt-2 font-medium text-center">
            {goal - points} more → Next Tier 🌱
          </p>
        </div>

        {/* Redeem */}
        <div>
          <h2 className="text-2xl font-extrabold mb-6 text-gray-900 text-center">
            Redeem Experiences 🗺️
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-6">
            {[
              { name: "National Park Entry", cost: 500, icon: "🏞️" },
              { name: "Tree Planting Event", cost: 800, icon: "🌳" },
              { name: "Local Eco Tour", cost: 1500, icon: "🚲" },
              { name: "Wildlife Sanctuary Visit", cost: 2000, icon: "🐘" },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-gradient-to-b from-[#FDF6EC] to-[#F9EFD8] rounded-2xl shadow-md p-6 flex flex-col items-center justify-center border-2 border-[#F5E7C5] hover:scale-105 hover:shadow-lg transition-transform duration-300 ease-out"
              >
                <div className="w-20 h-20 bg-white rounded-full mb-3 flex items-center justify-center text-4xl shadow-inner">
                  {item.icon}
                </div>
                <p className="font-bold text-gray-800 text-center">
                  {item.name}
                </p>
                <p className="text-sm text-gray-700 font-medium">
                  {item.cost} pts
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
