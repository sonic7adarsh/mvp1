import React, { createContext, useContext, useEffect, useState } from 'react'
import { publicApi } from '../api/publicApi'

export type LocationState = {
  lat: number | null
  lng: number | null
  label: string
  subLabel?: string // Additional details (e.g. City, State, or Full Address)
  source: "MANUAL" | "GPS" | "fallback" | "ip-fallback"
  confirmed: boolean
}

type LocationContextType = {
  location: LocationState | null
  setLocation: (loc: LocationState) => void
  requestCurrentLocation: () => Promise<void>
  clearLocation: () => void
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'customer_location'

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<LocationState | null>(null)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number' && parsed.confirmed) {
           setLocationState(parsed)
        }
      }
    } catch (e) {
      console.error('Failed to parse stored location', e)
    }
  }, [])

  const setLocation = (loc: LocationState) => {
    setLocationState(loc)
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loc))
    } catch (e) {
      console.error('Failed to save location', e)
    }
  }

  // Task 1: Strict User-Initiated GPS
  const requestCurrentLocation = async (): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude

          try {
            // 🔥 BACKEND CALL (NOT NOMINATIM)
            const res = await publicApi.get(
              '/api/location/reverse',
              { params: { lat, lng } }
            )
            
            const data = res.data

            // Format: "Sector 62, Noida" or fallback
            const label = (data.locality && data.city)
              ? `${data.locality}, ${data.city}`
              : (data.city || data.locality || 'Current Location')

            setLocation({
              lat,
              lng,
              label, 
              source: 'GPS',
              confirmed: true
            })

            resolve()
          } catch (err) {
            console.error('Location reverse lookup failed', err)
            // Fallback to coordinates only if backend fails
            setLocation({
              lat,
              lng,
              label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
              source: 'GPS',
              confirmed: true
            })
            resolve()
          }
        },
        (err) => reject(err),
        { enableHighAccuracy: true }
      )
    })
  }

  const clearLocation = () => {
    setLocationState(null)
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  return (
    <LocationContext.Provider value={{ location, setLocation, requestCurrentLocation, clearLocation }}>
      {children}
    </LocationContext.Provider>
  )
}

export function useLocation() {
  const context = useContext(LocationContext)
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider')
  }
  return context
}
