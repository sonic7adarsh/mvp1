import React, { useState, useEffect } from 'react'
import { useLocation } from '../context/LocationContext'
import { searchLocations, type SearchLocationResult } from '../services/locationSearch'

interface LocationBottomSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function LocationBottomSheet({ isOpen, onClose }: LocationBottomSheetProps) {
  const { setLocation, requestCurrentLocation } = useLocation()
  const [manualQuery, setManualQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [results, setResults] = useState<SearchLocationResult[]>([])

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (manualQuery.length < 3) {
        setResults([])
        return
      }
      setLoading(true)
      const res = await searchLocations(manualQuery)
      setResults(res)
      setLoading(false)
    }, 300)

    return () => clearTimeout(delay)
  }, [manualQuery])

  if (!isOpen) return null

  const handleGPS = async () => {
    setLoading(true)
    setError('')
    try {
      await requestCurrentLocation()
      onClose()
    } catch (err) {
      setError('GPS failed. Please enter location manually.')
      setLoading(false)
    }
  }

  const selectSuggestion = (place: SearchLocationResult) => {
    setLocation({
       lat: place.lat,
       lng: place.lng,
       label: place.label, 
       source: 'MANUAL',
       confirmed: true
    })
    onClose()
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 100,
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center'
  }

  const sheetStyle: React.CSSProperties = {
    background: '#FFFFFF',
    width: '100%',
    maxWidth: '420px',
    borderTopLeftRadius: '20px',
    borderTopRightRadius: '20px',
    padding: '24px',
    boxSizing: 'border-box',
    boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '24px',
    color: '#111827',
  }

  const gpsButtonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    cursor: 'pointer',
    marginBottom: '24px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#E23744', // Accent Color for "Use Current Location"
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    background: '#F9FAFB',
    fontSize: '15px',
    color: '#111827',
    marginBottom: '16px',
    boxSizing: 'border-box',
    outline: 'none',
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={sheetStyle} onClick={e => e.stopPropagation()}>
        <div style={titleStyle}>Select Location</div>

        <button style={gpsButtonStyle} onClick={handleGPS} disabled={loading}>
          <span>📍</span>
          <span>{loading && manualQuery === '' ? 'Detecting...' : 'Use my current location'}</span>
        </button>

        <div style={{ 
          textAlign: 'center', 
          color: '#6B7280', 
          fontSize: '13px', 
          marginBottom: '16px',
          fontWeight: 500
        }}>
          OR ENTER MANUALLY
        </div>

        <input
          type="text"
          placeholder="Search for area, street name..."
          style={inputStyle}
          value={manualQuery}
          onChange={e => setManualQuery(e.target.value)}
        />
          
        {/* Suggestions List */}
        {results.map((s, idx) => ( 
           <div 
             key={`${s.lat}-${s.lng}-${idx}`} 
             onClick={() => selectSuggestion(s)} 
             className="px-4 py-3 cursor-pointer hover:bg-gray-100" 
             style={{
               padding: '12px 16px',
               cursor: 'pointer',
               borderBottom: '1px solid #f3f4f6'
             }}
           > 
             {s.label} 
           </div> 
         ))}
        
        {error && (
            <div style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>
                {error}
            </div>
        )}
      </div>
    </div>
  )
}


