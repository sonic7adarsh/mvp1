import React, { createContext, useContext, useEffect, useState } from 'react'

import { getGoogleAddress } from '../utils/locationHelpers'
import { loadGoogleMaps } from '../utils/googleMapsLoader'

export type LocationState = {
  label: string
  subLabel?: string
  lat?: number
  lng?: number
  source: "MANUAL" | "GPS" | "fallback"
  confirmed: boolean
}

type LocationContextType = {
  location: LocationState | null
  setLocation: (loc: LocationState) => void
  requestCurrentLocation: () => Promise<void>
  clearLocation: () => void
  isDetecting: boolean
}

const LocationContext = createContext<LocationContextType | undefined>(undefined)

const LOCAL_STORAGE_KEY = 'customer_location'

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<LocationState | null>(null)
  const [isDetecting, setIsDetecting] = useState(false)

  // Debug Log to verify new code is loaded
  useEffect(() => {
    console.error('!!! LOCATION CONTEXT LOADED !!!')
    loadGoogleMaps().then(() => console.error('Google Maps Script Loaded')).catch(e => console.error('Script Load Error', e))

    const apiKey = (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY
    if (apiKey) {
      console.error('GOOGLE MAPS API KEY FOUND:', apiKey.substring(0, 10) + '...')
    } else {
      console.error('GOOGLE MAPS API KEY MISSING')
    }
  }, [])

  // Restore from Local Storage OR Auto-Detect
  useEffect(() => {
    const initLocation = async () => {
      try {
        const stored = window.localStorage.getItem(LOCAL_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed && parsed.confirmed) {
             setLocationState(parsed)
             return
          }
        }
        
        // If no stored location, Auto-Detect
        console.error('No stored location, attempting auto-detect...')
        await requestCurrentLocation()
      } catch (e) {
        console.error('Initialization error', e)
      }
    }

    initLocation()
  }, [])

  const setLocation = (loc: LocationState) => {
    setLocationState(loc)
    try {
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loc))
    } catch (e) {
      console.error('Failed to save location', e)
    }
  }

  const requestCurrentLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser')
    }

    setIsDetecting(true)

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords
            
            // PRIORITY: Google Maps (if Key exists)
            const googleData = await getGoogleAddress(latitude, longitude)
            if (googleData) {
               setLocation({
                 label: googleData.label,
                 subLabel: googleData.subLabel,
                 lat: latitude,
                 lng: longitude,
                 source: 'GPS',
                 confirmed: true
               })
               setIsDetecting(false)
               resolve()
               return
            } else {
               // Fallback if Google fails (e.g. Quota exceeded or Network error)
               // Simple fallback to lat/lng text
               setLocation({
                 label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
                 subLabel: 'Unknown Location',
                 lat: latitude,
                 lng: longitude,
                 source: 'GPS',
                 confirmed: true
               })
               setIsDetecting(false)
               resolve()
            }
          } catch (error) {
            console.error('Reverse geocoding failed', error)
            // Fallback if geocoding fails but we have coords
            setLocation({
              label: 'Current Location',
              subLabel: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              source: 'GPS',
              confirmed: true
            })
            setIsDetecting(false)
            resolve()
          }
        },
        (error) => {
          console.error('Geolocation Error:', error)
          setIsDetecting(false)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0
        }
      )
    })
  }

  const clearLocation = () => {
    setLocationState(null)
    window.localStorage.removeItem(LOCAL_STORAGE_KEY)
  }

  return (
    <LocationContext.Provider value={{ location, setLocation, requestCurrentLocation, clearLocation, isDetecting }}>
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
