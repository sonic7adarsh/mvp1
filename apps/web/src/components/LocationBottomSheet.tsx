import React, { useState, useEffect } from 'react'
import { useLocation } from '../context/LocationContext'

export interface LocationBottomSheetProps {
  isOpen: boolean
  onClose: () => void
}

import { loadGoogleMaps } from '../utils/googleMapsLoader'
import { useTranslation } from 'react-i18next'

export function LocationBottomSheet({ isOpen, onClose }: LocationBottomSheetProps) {
  const { t } = useTranslation()
  const { location, setLocation, requestCurrentLocation } = useLocation()
  const [manualQuery, setManualQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Dummy results for UI preservation
  const [results, setResults] = useState<any[]>([])
  
  const [autocompleteService, setAutocompleteService] = useState<any>(null)
  const [placesService, setPlacesService] = useState<any>(null)

  useEffect(() => {
    // Retry mechanism for loading Google Maps
    const initMaps = () => {
        loadGoogleMaps().then(() => {
            if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
                setAutocompleteService(new (window as any).google.maps.places.AutocompleteService())
                setPlacesService(new (window as any).google.maps.places.PlacesService(document.createElement('div')))
                console.error('GOOGLE MAPS SERVICES INITIALIZED')
            }
        }).catch(e => {
            console.error('Failed to load Google Maps in Sheet', e)
        })
    }

    initMaps()
    
    // Safety check in case it failed first time (e.g. network blip)
    const retryTimer = setTimeout(() => {
        if (!autocompleteService) {
            console.error('RETRYING GOOGLE MAPS INIT')
            initMaps()
        }
    }, 2000)

    return () => clearTimeout(retryTimer)
  }, [])

  useEffect(() => {
    if (manualQuery.length < 3) {
      setResults([])
      return
    }
    
    // Google Places Autocomplete (JS API)
    const timer = setTimeout(() => {
      if (!autocompleteService) {
          console.error('Autocomplete Service NOT READY yet')
          return
      }

      const request = {
          input: manualQuery,
          componentRestrictions: { country: 'in' },
          // types: ['geocode', 'establishment'] // Optional: to broaden results if needed
      }

      console.error('SEARCHING PLACES (JS API):', manualQuery)

      autocompleteService.getPlacePredictions(request, (predictions: any[], status: any) => {
          console.error('PLACES RESPONSE (JS API):', status, predictions)
          
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
             const mapped = predictions.map((item: any) => ({
                 label: item.structured_formatting.main_text,
                 subLabel: item.structured_formatting.secondary_text,
                 placeId: item.place_id,
                 lat: 0, // Fetched on select
                 lng: 0,
                 raw: item
             }))
             setResults(mapped)
          } else {
             setResults([])
          }
      })
    }, 500)
    return () => clearTimeout(timer)
  }, [manualQuery, autocompleteService])

  if (!isOpen) return null

  const handleGPS = async () => {
    setLoading(true)
    setError('')
    try {
      await requestCurrentLocation()
      onClose()
    } catch (err) {
      setError(t('location_sheet.gps_failed'))
      setLoading(false)
    }
  }

  const selectSuggestion = (place: any) => {
    // If we have a placeId but no lat/lng (from Places API), fetch details
    if (place.placeId && (!place.lat || !place.lng)) {
        if (placesService) {
            placesService.getDetails({
                placeId: place.placeId,
                fields: ['geometry', 'formatted_address']
            }, (placeResult: any, status: any) => {
                if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && placeResult.geometry) {
                    setLocation({
                        label: place.label,
                        subLabel: place.subLabel,
                        lat: placeResult.geometry.location.lat(),
                        lng: placeResult.geometry.location.lng(),
                        source: 'MANUAL',
                        confirmed: true
                    })
                    onClose()
                } else {
                    console.error('Place Details Failed', status)
                }
            })
            return
        }
    }

    setLocation({
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
        <div style={titleStyle}>{t('location_sheet.title')}</div>

        {location?.confirmed && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '11px', color: '#6B7280', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
              {t('location_sheet.current_location')}
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>📍</span>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#111827', lineHeight: '1.4' }}>
                  {location.label}
                </div>
                {location.subLabel && (
                  <div style={{ fontSize: '13px', color: '#4B5563', marginTop: '2px', lineHeight: '1.4' }}>
                    {location.subLabel}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <button style={gpsButtonStyle} onClick={handleGPS} disabled={loading}>
          <span>📍</span>
          <span>{loading && manualQuery === '' ? t('location_sheet.detecting') : t('location_sheet.use_current_location')}</span>
        </button>

        <div style={{ 
          textAlign: 'center', 
          color: '#6B7280', 
          fontSize: '13px', 
          marginBottom: '16px',
          fontWeight: 500
        }}>
          {t('location_sheet.or_enter_manually')}
        </div>

        <input
          type="text"
          placeholder={t('location_sheet.search_placeholder')}
          style={inputStyle}
          value={manualQuery}
          onChange={e => setManualQuery(e.target.value)}
        />
          
        {/* Suggestions List */}
        {results.map((s, idx) => ( 
           <div 
             key={idx} 
             onClick={() => selectSuggestion(s)} 
             style={{
               padding: '12px 16px',
               cursor: 'pointer',
               borderBottom: '1px solid #f3f4f6',
               display: 'flex',
               flexDirection: 'column',
               gap: '4px'
             }}
           > 
             <div style={{ fontWeight: 600, color: '#111827', fontSize: '15px' }}>
                {s.label}
             </div>
             {s.subLabel && (
                <div style={{ fontSize: '13px', color: '#6B7280' }}>
                    {s.subLabel}
                </div>
             )}
           </div> 
         ))}
        
        {error && (
            <div style={{ color: 'red', fontSize: '14px', marginTop: '10px' }}>
                {error}
            </div>
        )}

        <div 
          onClick={onClose}
          style={{
            marginTop: '16px',
            textAlign: 'center',
            padding: '14px',
            borderRadius: '12px',
            background: '#000000',
            color: '#FFFFFF',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {t('location_sheet.cancel')}
        </div>
      </div>
    </div>
  )
}


