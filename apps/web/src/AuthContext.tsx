import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { setPrivateApiAuth } from './api/privateApi'

type AuthState = {
  isAuthenticated: boolean
  jwt: string
  userId?: string
  roles?: string[]
}

type AuthContextType = AuthState & {
  login: (jwt: string, user?: { id?: string; roles?: string[] }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [jwt, setJwt] = useState<string>('')
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [roles, setRoles] = useState<string[] | undefined>(undefined)

  useEffect(() => {
    const stored = localStorage.getItem('customer_token') || ''
    
    // Check if token is expired
    let isValid = false
    if (stored) {
      try {
        const payload = JSON.parse(atob(stored.split('.')[1]))
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          isValid = true
        }
      } catch (e) {
        // Invalid token format
      }
    }

    if (isValid) {
      setJwt(stored)
      setPrivateApiAuth(stored)
      
      const storedUserId = localStorage.getItem('customer_user_id')
      if (storedUserId) setUserId(storedUserId)

      const storedRoles = localStorage.getItem('customer_roles')
      if (storedRoles) {
        try {
          setRoles(JSON.parse(storedRoles))
        } catch (e) {
          console.error('Failed to parse roles', e)
        }
      }
    } else {
      // Clear invalid/expired token
      localStorage.removeItem('customer_token')
      localStorage.removeItem('customer_user_id')
      localStorage.removeItem('customer_roles')
    }

    // Listen for auth:logout event from privateApi (401 responses)
    const handleLogoutEvent = () => {
      logout()
    }
    window.addEventListener('auth:logout', handleLogoutEvent)
    
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent)
    }
  }, [])

  // Auto-logout when token expires
  useEffect(() => {
    if (!jwt) return

    let timer: NodeJS.Timeout
    try {
      const parts = jwt.split('.')
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]))
        if (payload.exp) {
          const timeLeft = payload.exp * 1000 - Date.now()
          if (timeLeft > 0) {
            // Set timer to logout just before token expires
            timer = setTimeout(() => {
              logout()
            }, timeLeft)
          } else {
            // Token already expired
            logout()
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse JWT expiry', e)
    }

    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [jwt])

  const login = (nextJwt: string, user?: { id?: string; roles?: string[] }) => {
    setJwt(nextJwt)
    setUserId(user?.id)
    setRoles(user?.roles)
    localStorage.setItem('customer_token', nextJwt)
    if (user?.id) localStorage.setItem('customer_user_id', user.id)
    if (user?.roles) localStorage.setItem('customer_roles', JSON.stringify(user.roles))
    setPrivateApiAuth(nextJwt)
  }

  const logout = () => {
    setJwt('')
    setUserId(undefined)
    setRoles(undefined)
    localStorage.removeItem('customer_token')
    localStorage.removeItem('customer_user_id')
    localStorage.removeItem('customer_roles')
    setPrivateApiAuth(undefined)
  }

  const value: AuthContextType = useMemo(
    () => ({ isAuthenticated: !!jwt, jwt, userId, roles, login, logout }),
    [jwt, userId, roles]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}