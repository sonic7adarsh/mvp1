import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Crosshair } from 'lucide-react'
import { useToast } from '../ToastContext'

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface MapSelectorProps {
  initialLat?: number
  initialLng?: number
  onLocationSelect: (lat: number, lng: number) => void
}

function LocationMarker({ onSelect, initialPos, position, setPosition }: { 
  onSelect: (lat: number, lng: number) => void, 
  initialPos: [number, number],
  position: L.LatLngExpression,
  setPosition: (pos: L.LatLngExpression) => void
}) {
  const map = useMapEvents({
    click(e: L.LeafletMouseEvent) {
      setPosition(e.latlng)
      onSelect(e.latlng.lat, e.latlng.lng)
      map.flyTo(e.latlng, map.getZoom())
    },
  })

  useEffect(() => {
    map.flyTo(initialPos, 15)
  }, [initialPos, map])

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

function RecenterMap({ lat, lng }: { lat: number, lng: number }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo([lat, lng], 15)
  }, [lat, lng, map])
  return null
}

export default function MapSelector({ initialLat = 28.6139, initialLng = 77.2090, onLocationSelect }: MapSelectorProps) {
  const { showToast } = useToast()
  const [ready, setReady] = useState(false)
  const [isLocating, setIsLocating] = useState(false)
  const [position, setPosition] = useState<L.LatLngExpression>([initialLat, initialLng])
  const [currentLat, setCurrentLat] = useState(initialLat)
  const [currentLng, setCurrentLng] = useState(initialLng)

  useEffect(() => {
    setReady(true)
  }, [])

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      setIsLocating(true)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords
          setCurrentLat(latitude)
          setCurrentLng(longitude)
          setPosition([latitude, longitude])
          onLocationSelect(latitude, longitude)
          setIsLocating(false)
        },
        (err) => {
          console.error("Geolocation error:", err)
          showToast("Could not access location. Please enable location permissions.", 'error')
          setIsLocating(false)
        }
      )
    } else {
      showToast("Geolocation is not supported by your browser", 'error')
    }
  }

  if (!ready) return <div style={{ height: 300, background: '#eee', borderRadius: 12 }}>Loading Map...</div>

  return (
    <div style={{ position: 'relative', height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer 
        center={[initialLat, initialLng]} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          maxZoom={20}
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          attribution='&copy; Google Maps'
        />
        <LocationMarker 
          onSelect={onLocationSelect} 
          initialPos={[currentLat, currentLng]} 
          position={position}
          setPosition={setPosition}
        />
        <RecenterMap lat={currentLat} lng={currentLng} />
      </MapContainer>
      
      <button
        onClick={handleLocateMe}
        disabled={isLocating}
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          background: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '8px 12px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          cursor: isLocating ? 'wait' : 'pointer',
          fontWeight: 600,
          color: isLocating ? '#9CA3AF' : 'var(--primary)',
          fontSize: 13
        }}
      >
        <Crosshair size={16} className={isLocating ? 'animate-spin' : ''} />
        {isLocating ? 'Detecting...' : 'Use Current Location'}
      </button>
      
      <div style={{ 
        position: 'absolute', 
        top: 10, 
        left: '50%', 
        transform: 'translateX(-50%)', 
        zIndex: 1000, 
        background: 'rgba(255,255,255,0.9)', 
        padding: '4px 12px', 
        borderRadius: 20, 
        fontSize: 12, 
        fontWeight: 500,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        Google Maps View
      </div>
    </div>
  )
}
