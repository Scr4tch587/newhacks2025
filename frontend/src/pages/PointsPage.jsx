import { useEffect, useState } from "react";

// Import your images
import sky from "../images/sky.png";
import mountains from "../images/mountains.png";
import store1Logo from "../images/store1.png";
import store2Logo from "../images/store2.png";
import store3Logo from "../images/store3.png";
import store4Logo from "../images/store4.png";
import store5Logo from "../images/store5.png";

export default function PointsPage() {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [openIndex, setOpenIndex] = useState(null);
  const [scrollY, setScrollY] = useState(0);

  // constants (replace with backend later)
  const points = 50;
  const goal = 500;
  const progress = Math.min((points / goal) * 100, 100);

  // animate bar
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 300);
    return () => clearTimeout(timer);
  }, [progress]);

  // track scroll for parallax
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Example stores + coupons
  const stores = [
    {
      name: "Store 1",
      logo: store1Logo,
      coupons: [
        { img: "🏷️", title: "10% Off", desc: "On all products" },
        { img: "🚚", title: "Free Shipping", desc: "Orders over $25" },
        { img: "🎁", title: "BOGO", desc: "Buy 1 Get 1 Free" },
      ],
    },
    {
      name: "Store 2",
      logo: store2Logo,
      coupons: [
        { img: "💳", title: "$5 Gift Card", desc: "With 200 pts" },
        { img: "🔥", title: "15% Off", desc: "Orders over $50" },
        { img: "🎟️", title: "Bonus Entry", desc: "Spice raffle" },
      ],
    },
    {
      name: "Store 3",
      logo: store3Logo,
      coupons: [
        { img: "🌿", title: "50% Off Bakery Tours", desc: "For all ages" },
        { img: "🚴", title: "Free Breadstick", desc: "With any purchase" },
        { img: "🌍", title: "Eco Badge", desc: "Collect digital rewards" },
      ],
    },
    {
      name: "Store 4",
      logo: store4Logo,
      coupons: [
        { img: "📦", title: "Free Coffee", desc: "With any purchase" },
        { img: "🏷️", title: "10% Off", desc: "Any sweet treat" },
        { img: "🚴", title: "Rooftop Access", desc: "After 7pm" },
      ],
    },
    {
      name: "Store 5",
      logo: store5Logo,
      coupons: [
        { img: "👜", title: "Eco Tote", desc: "Reusable bag" },
        { img: "💵", title: "5% Cashback", desc: "On all items" },
        { img: "🌎", title: "Eco Points", desc: "Earn 2x points" },
      ],
    },
  ];

  const toggleRow = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center py-12 px-4 font-cartoon overflow-hidden">
      {/* === BACKGROUND === */}
      <img
        src={sky}
        alt="Sky background"
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{ transform: `translateY(${scrollY * 0.75}px)` }} // sky moves faster (0.5x scroll)
      />
      <img
        src={mountains}
        alt="Mountains"
        className="absolute bottom-0 w-full object-cover z-10"
      />

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
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(110deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.4)_40%,rgba(255,255,255,0)_80%)] animate-[shine_2s_infinite]" />
          </div>
          <p className="text-md text-gray-800 mt-2 font-medium text-center">
            {goal - points} more → Next Tier 🌱
          </p>
        </div>

        {/* Redeem Section */}
        <div>
          <h2 className="text-2xl font-extrabold mb-6 text-gray-900 text-center">
            Redeemable Rewards
          </h2>
          <div className="space-y-6">
            {stores.map((store, i) => (
              <div
                key={store.name}
                className="bg-gradient-to-b from-[#FDF6EC] to-[#F9EFD8] rounded-2xl shadow-md border-2 border-[#F5E7C5] overflow-hidden"
              >
                {/* Collapsed Header = JUST Logo */}
                <div
                  onClick={() => toggleRow(i)}
                  className="flex justify-center items-center p-6 cursor-pointer hover:bg-[#f8edd9] transition"
                >
                  <img
                    src={store.logo}
                    alt={store.name}
                    className="max-h-24 object-contain"
                  />
                </div>

                {/* Dropdown Coupons */}
                {openIndex === i && (
                  <div className="p-4 border-t border-[#F5E7C5] bg-[#FFFDF6] grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {store.coupons.map((coupon, j) => (
                      <div
                        key={j}
                        className="flex flex-col items-center bg-white rounded-xl p-3 shadow-sm border border-gray-200"
                      >
                        <div className="text-3xl mb-2">{coupon.img}</div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {coupon.title}
                        </p>
                        <p className="text-gray-600 text-xs text-center">
                          {coupon.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
