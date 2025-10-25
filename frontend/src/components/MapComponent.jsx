import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import ListingMarker from './ListingMarker'
import UserLocationMarker from './UserLocationMarker'

function RecenterOnChange({ center }) {
  const map = useMap()
  useEffect(() => {
    if (!center) return
    const arr = Array.isArray(center)
      ? center
      : (center.lat != null && center.lng != null ? [center.lat, center.lng] : null)
    if (arr) {
      map.setView(arr, map.getZoom())
    }
  }, [center, map])
  return null
}

export default function MapComponent({ listings = [], onSelectListing, center }) {
  const defaultCenter = listings[0] ? [listings[0].lat, listings[0].lng] : [43.653, -79.383]
  const mapCenter = Array.isArray(center)
    ? center
    : (center?.lat != null && center?.lng != null ? [center.lat, center.lng] : defaultCenter)
  return (
    <div className="w-full h-full">
      <MapContainer center={mapCenter} zoom={14} scrollWheelZoom className="h-full w-full">
        <RecenterOnChange center={mapCenter} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((l) => (
          <ListingMarker
            key={l.id || l.qr_code_id || l.name}
            listing={l}
            onClick={() => onSelectListing?.(l)}
            onPopupClose={() => onSelectListing?.(null)}
          />
        ))}
        <UserLocationMarker />
      </MapContainer>
    </div>
  )
}
