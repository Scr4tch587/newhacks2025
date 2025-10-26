import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MapComponent from '../components/MapComponent'
import MapSidebar from '../components/MapSidebar'
import ListingDetailModal from '../components/ListingDetailModal'
import PickUpModal from '../components/PickUpModal'
import { getNearbyItems } from '../utils/FastAPIClient'
import Footsteps from "../components/Footsteps";

// import your background layers
import sky from "../images/sky.png"
import mountains from "../images/mountains.png"
import woodframe from "../images/woodframe.png"

// Define constants for the frame dimensions
const BORDER_WIDTH = 40; // The width of the image border
const FRAME_OVERLAP_PX = 20; // How far you want the frame to "pop out" past the container's edge

export default function DashboardPage() {
  const [listings, setListings] = useState([])
  const [selected, setSelected] = useState(null)
  const [pickupFor, setPickupFor] = useState(null)
  const [origin, setOrigin] = useState({ lat: 43.653, lng: -79.383 })
  const [scrollY, setScrollY] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
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

    ;(async () => {
      let originLoc = { lat: 43.653, lng: -79.383 }
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              originLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
              resolve()
            },
            () => resolve(),
            { enableHighAccuracy: true, timeout: 5000 }
          )
        })
      }

      try {
        const items = await getNearbyItems({ lat: originLoc.lat, lng: originLoc.lng, limit: 100 })
        const mapped = (items || []).map((it) => {
          const id = it.id || it.qr_code_id
          const hasCoords = (typeof it.lat === 'number') && (typeof it.lng === 'number')
          const distanceKm = (typeof it.distance_km === 'number')
            ? it.distance_km
            : (hasCoords ? haversineKm(originLoc.lat, originLoc.lng, it.lat, it.lng) : null)
          return {
            id,
            qr_code_id: it.qr_code_id || id,
            name: it.name,
            title: it.name,
            description: it.description,
            image_url: it.image_url || it.image_link || null,
            lat: it.lat,
            lng: it.lng,
            owner_name: it.owner_name || null,
            owner_email: it.owner_email || null,
            owner_address: it.owner_address || it.address || null,
            distanceKm,
          }
        })
        setListings(mapped)
        setOrigin(originLoc)
      } catch (e) {
        console.error('Failed to load nearby items', e)
      }
    })()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
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

      {/* === MAIN DASHBOARD CONTENT === */}
      <div className="relative z-30 max-w-6xl mx-auto p-4 space-y-4">
        {/* Spacer above the framed map */}
        <div className="h-8" />

        {/* === MAP WITH WOOD FRAME === */}
        <div
          className="flex h-[70vh] w-full overflow-hidden shadow-xl"
          style={{
            // 1. Pull the container out by the desired overlap amount
            margin: `-${FRAME_OVERLAP_PX}px`, 
            
            // 2. Add padding to make the container large enough for the border PLUS the overlap
            padding: `${BORDER_WIDTH + FRAME_OVERLAP_PX}px`, 

            // 3. Define the border to hold the image
            border: `${BORDER_WIDTH}px solid transparent`,
            borderImage: `url(${woodframe}) 60 round`, 
            
            // Other styles
            backgroundColor: 'white', 
          }}
        >
          <MapSidebar listings={listings} onSelectListing={setSelected} />
          <div className="flex-1">
            <MapComponent
              center={[origin.lat, origin.lng]}
              listings={listings}
              onSelectListing={setSelected}
            />
          </div>
        </div>

        <ListingDetailModal
          isOpen={!!selected}
          listing={selected}
          onClose={() => setSelected(null)}
          onDonate={(listing) => { setPickupFor(listing); setSelected(null) }}
        />

        <PickUpModal
          open={!!pickupFor}
          listing={pickupFor}
          onClose={(didSchedule) => {
            setPickupFor(null)
            if (didSchedule) {
              // Optimistically mark the item unavailable in local state
              setListings((prev) => prev.map(it => (
                (it.id === pickupFor?.id || it.qr_code_id === pickupFor?.qr_code_id)
                  ? { ...it, status: 'unavailable' }
                  : it
              )))
            }
          }}
        />
      </div>

      {/* footsteps animation overlay */}
      <Footsteps />
    </div>
  )
}