import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type AuthState = {
  isAuthenticated: boolean
  jwt: string
  userId?: string
  roles?: string[]
}

type AuthContextType = AuthState & {
  login: (jwt: string, user: { id: string; roles?: string[] }) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [jwt, setJwt] = useState<string>('')
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [roles, setRoles] = useState<string[] | undefined>(undefined)

  useEffect(() => {
    const stored = localStorage.getItem('seller_token') || ''
    if (stored) setJwt(stored)
  }, [])

  const login = (nextJwt: string, user: { id: string; roles?: string[] }) => {
    setJwt(nextJwt)
    setUserId(user.id)
    setRoles(user.roles)
    localStorage.setItem('seller_token', nextJwt)
  }

  const logout = () => {
    setJwt('')
    setUserId(undefined)
    setRoles(undefined)
    localStorage.removeItem('seller_token')
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