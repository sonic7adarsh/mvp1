import { createContext, useContext, useMemo, useState } from 'react'

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
  const [jwt, setJwt] = useState<string>(() => localStorage.getItem('seller_token') || '')
  const [userId, setUserId] = useState<string | undefined>(undefined)
  const [roles, setRoles] = useState<string[] | undefined>(undefined)

  // Remove the useEffect that sets jwt from localStorage since we use lazy init
  // We can add logic here to restore userId/roles from token if needed in the future

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