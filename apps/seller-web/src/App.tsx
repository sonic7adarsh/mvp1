import React, { useEffect, useState, useRef } from 'react'
import SellerLogin from './pages/SellerLogin'
import SellerDashboard from './pages/SellerDashboard'
import SellerProducts from './pages/SellerProducts'
import SellerOrders from './pages/SellerOrders'
import SellerEarnings from './pages/SellerEarnings'
import SellerProfile from './pages/SellerProfile'
import SellerOnboarding from './pages/SellerOnboarding'
import BottomNav from './components/BottomNav'
import { AuthProvider, useAuth } from './AuthContext'
import { ToastProvider } from './ToastContext'
import { apiFetch } from './api/client'
import './index.css'

function getRoute(): string {
  const fullHash = window.location.hash || '#/login'
  const path = fullHash.split('?')[0]
  return path.replace(/^#/, '')
}

function MainLayout() {
  const { jwt } = useAuth()
  const [route, setRoute] = useState<string>(getRoute())
  const [ordersCount, setOrdersCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/login'
    }
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Redirect to login if not authenticated and trying to access protected route
  useEffect(() => {
    if (!jwt && route !== '/login' && route !== '/onboarding') {
      window.location.hash = '/login'
    }
  }, [jwt, route])

  // Poll for active orders
  useEffect(() => {
    if (!jwt) return
    const fetchCount = async () => {
      try {
        const res = await apiFetch<any>('/api/seller/dashboard-stats', {}, { jwt })
        // Assuming stats returns { pending: X, inProgress: Y }
        const pending = res.pending || 0
        setOrdersCount(pending + (res.inProgress || 0))
        setPendingCount(pending)
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 5000)
    return () => clearInterval(interval)
  }, [jwt])

  // Global Alarm for Pending Orders
  useEffect(() => {
    if (pendingCount > 0) {
      if (!audioRef.current) {
        // Simple beep data URI (short beep)
        audioRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU')
      }

      const playAlarm = () => {
        try {
          // Re-create audio context or use simple Audio
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.type = 'sine'
          osc.frequency.value = 880 // A5
          gain.gain.value = 0.1
          osc.start()
          setTimeout(() => osc.stop(), 200) // 200ms beep
          setTimeout(() => {
              const osc2 = ctx.createOscillator()
              const gain2 = ctx.createGain()
              osc2.connect(gain2)
              gain2.connect(ctx.destination)
              osc2.type = 'sine'
              osc2.frequency.value = 880
              gain2.gain.value = 0.1
              osc2.start()
              setTimeout(() => osc2.stop(), 200)
          }, 400) // Double beep
        } catch (e) {
          console.error('Audio play failed', e)
        }
      }
      
      // Play immediately
      playAlarm()
      
      // Loop every 3 seconds
      const interval = setInterval(playAlarm, 3000)
      return () => clearInterval(interval)
    }
  }, [pendingCount])

  let Page: () => React.ReactElement
  let activeTab = 'dashboard'

  switch (route) {
    case '/login':
      Page = SellerLogin
      break
    case '/onboarding':
      Page = SellerOnboarding
      break
    case '/dashboard':
      Page = SellerDashboard
      activeTab = 'dashboard'
      break
    case '/products':
      Page = SellerProducts
      activeTab = 'products'
      break
    case '/orders':
      Page = SellerOrders
      activeTab = 'orders'
      break
    case '/orders/detail':
      // Still render SellerOrders but the component handles the hash params (e.g. #/orders/detail?id=...)
      // However, to make it clean, we can just use the same Page component as it now checks selectedOrder
      Page = SellerOrders
      activeTab = 'orders'
      break
    case '/earnings':
      Page = SellerEarnings
      activeTab = 'dashboard' // Keep dashboard active or add earnings tab? Let's keep dashboard.
      break
    case '/profile':
      Page = SellerProfile
      activeTab = 'profile'
      break
    default:
      Page = SellerLogin
      break
  }

  const showNav = route !== '/login' && route !== '/onboarding'

  const handleNavigate = (path: string) => {
    window.location.hash = path
  }

  return (
    <div className="app-container">
      <Page />
      {showNav && (
        <BottomNav 
          activeTab={activeTab} 
          onNavigate={handleNavigate} 
          ordersCount={ordersCount} 
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainLayout />
      </ToastProvider>
    </AuthProvider>
  )
}
