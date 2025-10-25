import { useEffect, useState } from 'react'
import L from 'leaflet'
import { Marker, Tooltip } from 'react-leaflet'

const userIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
  iconRetinaUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
})

export default function UserLocationMarker() {
  const [position, setPosition] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      (err) => {
        // fallback: do nothing
      },
      { enableHighAccuracy: true }
    )
    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  if (!position) return null
  return (
    <Marker position={[position.lat, position.lng]} icon={userIcon}>
      <Tooltip direction="top" offset={[-15, -15]} permanent>
        <span className="font-bold text-indigo-700">Me</span>
      </Tooltip>
    </Marker>
  )
}
