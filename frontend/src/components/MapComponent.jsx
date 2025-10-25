import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import ListingMarker from './ListingMarker'

export default function MapComponent({ listings = [], onSelectListing }) {
  const center = listings[0] ? [listings[0].lat, listings[0].lng] : [43.653, -79.383]
  return (
    <div className="w-full h-[70vh] rounded-lg overflow-hidden border border-gray-200">
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listings.map((l) => (
          <ListingMarker key={l.id} listing={l} onClick={() => onSelectListing?.(l)} />
        ))}
      </MapContainer>
    </div>
  )
}
