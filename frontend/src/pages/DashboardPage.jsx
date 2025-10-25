import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MapComponent from '../components/MapComponent'
import MapSidebar from '../components/MapSidebar'
import ListingDetailModal from '../components/ListingDetailModal'
import { fetchItems, fetchOwnerLocation } from '../utils/FakeAPI'

export default function DashboardPage() {
  const [listings, setListings] = useState([])
  const [selected, setSelected] = useState(null)
  const [origin, setOrigin] = useState({ lat: 43.653, lng: -79.383 })
  const navigate = useNavigate()

  useEffect(() => {
    // Helper to compute Haversine distance in km
    const haversineKm = (lat1, lon1, lat2, lon2) => {
      const toRad = (d) => (d * Math.PI) / 180
      const R = 6371
      const dLat = toRad(lat2 - lat1)
      const dLon = toRad(lon2 - lon1)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    (async () => {
      // 1) Load items and their owner locations
      const items = await fetchItems()
      const itemsWithLocation = await Promise.all(
        items.map(async (item) => {
          const loc = await fetchOwnerLocation(item.owner_email)
          return loc ? { ...item, lat: loc.lat, lng: loc.lng } : item
        })
      )

      // 2) Try to get user's current location; fallback to Toronto downtown
      let origin = { lat: 43.653, lng: -79.383 }
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }
              resolve()
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 5000 }
          )
        })
      }

      // 3) Compute distance and sort
      const withDistance = itemsWithLocation.map((it) =>
        it.lat != null && it.lng != null
          ? { ...it, distanceKm: haversineKm(origin.lat, origin.lng, it.lat, it.lng) }
          : { ...it, distanceKm: Number.POSITIVE_INFINITY }
      )
      withDistance.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      setListings(withDistance)
      setOrigin(origin)
    })()
  }, [])

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Nearby Listings</h1>
        <button className="px-4 py-2 rounded bg-indigo-600 text-white" onClick={() => navigate('/donate')}>Donate Item</button>
      </div>
      <div className="flex h-[70vh] rounded-lg overflow-hidden border border-gray-200">
        <MapSidebar listings={listings} onSelectListing={setSelected} />
        <div className="flex-1">
          <MapComponent center={[origin.lat, origin.lng]} listings={listings} onSelectListing={setSelected} />
        </div>
      </div>

      <ListingDetailModal isOpen={!!selected} listing={selected} onClose={() => setSelected(null)} onDonate={() => navigate('/donate')} />
    </div>
  )
}
