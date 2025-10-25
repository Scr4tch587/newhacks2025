import L from 'leaflet'
import { Marker, Popup } from 'react-leaflet'

// Use a red marker icon for item markers
const redIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})

export default function ListingMarker({ listing, onClick, onPopupClose }) {
  if (!listing?.lat || !listing?.lng) return null
  return (
    <Marker position={[listing.lat, listing.lng]} icon={redIcon} eventHandlers={{ click: onClick }}>
      <Popup eventHandlers={{ remove: onPopupClose }}>
        <div className="space-y-1">
          <div className="font-medium">{listing.name || 'Listing'}</div>
          <button className="px-2 py-1 text-sm bg-indigo-600 text-white rounded" onClick={onClick}>Details</button>
        </div>
      </Popup>
    </Marker>
  )
}
