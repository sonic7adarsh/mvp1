import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

type RiderSessionState = {
  jwt: string
  riderId?: string
  onboarded: boolean
  activeRole?: string
  allowedRoles?: string[]
  availability: 'ONLINE' | 'OFFLINE'
}

type RiderSessionContextType = RiderSessionState & {
  setJwt: (jwt: string) => void
  setOnboarded: (v: boolean) => void
  setAvailability: (s: 'ONLINE' | 'OFFLINE') => void
  setRoles: (activeRole?: string, allowedRoles?: string[]) => void
}

const RiderSessionContext = createContext<RiderSessionContextType | undefined>(undefined)

export function RiderSessionProvider({ children }: { children: React.ReactNode }) {
  const [jwt, setJwtState] = useState<string>('')
  const [riderId, setRiderId] = useState<string | undefined>(undefined)
  const [onboarded, setOnboardedState] = useState<boolean>(false)
  const [activeRole, setActiveRole] = useState<string | undefined>(undefined)
  const [allowedRoles, setAllowedRoles] = useState<string[] | undefined>(undefined)
  const [availability, setAvailabilityState] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE')

  useEffect(() => {
    const stored = localStorage.getItem('rider_token') || ''
    if (stored) setJwtState(stored)
    const ob = localStorage.getItem('rider_onboarded')
    if (ob) setOnboardedState(ob === 'true')
    const av = localStorage.getItem('rider_availability')
    if (av === 'ONLINE' || av === 'OFFLINE') {
      setAvailabilityState(av as 'ONLINE' | 'OFFLINE')
    }
  }, [])

  const setJwt = (next: string) => {
    setJwtState(next)
    localStorage.setItem('rider_token', next)
  }
  const setOnboarded = (v: boolean) => {
    setOnboardedState(v)
    localStorage.setItem('rider_onboarded', String(v))
  }
  const setAvailability = (s: 'ONLINE' | 'OFFLINE') => {
    setAvailabilityState(s)
    try { localStorage.setItem('rider_availability', s) } catch {}
  }
  const setRoles = (role?: string, roles?: string[]) => {
    setActiveRole(role)
    setAllowedRoles(roles)
  }

  const value: RiderSessionContextType = useMemo(
    () => ({ jwt, riderId, onboarded, activeRole, allowedRoles, availability, setJwt, setOnboarded, setAvailability, setRoles }),
    [jwt, riderId, onboarded, activeRole, allowedRoles, availability]
  )

  return <RiderSessionContext.Provider value={value}>{children}</RiderSessionContext.Provider>
}

export function useRiderSession() {
  const ctx = useContext(RiderSessionContext)
  if (!ctx) throw new Error('useRiderSession must be used within RiderSessionProvider')
  return ctx
}