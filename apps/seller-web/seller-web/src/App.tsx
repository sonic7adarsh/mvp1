import React, { useEffect, useState } from 'react'
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
        setOrdersCount((res.pending || 0) + (res.inProgress || 0))
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [jwt])

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
