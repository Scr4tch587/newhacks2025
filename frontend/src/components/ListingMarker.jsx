import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'

// Fix Leaflet default icon paths in Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})

export default function ListingMarker({ listing, onClick }) {
  if (!listing?.lat || !listing?.lng) return null
  return (
    <Marker position={[listing.lat, listing.lng]} icon={defaultIcon} eventHandlers={{ click: onClick }}>
      <Popup>
        <div className="space-y-1">
          <div className="font-medium">{listing.name || 'Listing'}</div>
          <button className="px-2 py-1 text-sm bg-indigo-600 text-white rounded" onClick={onClick}>Details</button>
        </div>
      </Popup>
    </Marker>
  )
}
