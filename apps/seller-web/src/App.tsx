import React, { useEffect, useState } from 'react'
import SellerLogin from './pages/SellerLogin'
import SellerOrders from './pages/SellerOrders'
import SellerDashboard from './pages/SellerDashboard'
import './index.css'
import { AuthProvider } from './AuthContext'

function getRoute(): string {
  const fullHash = window.location.hash || '#/login'
  const path = fullHash.split('?')[0]
  return path.replace(/^#/, '')
}

export default function App() {
  const appStyle: React.CSSProperties = {
    maxWidth: '420px',
    margin: '0 auto',
    background: '#FFFFFF',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  }

  const [route, setRoute] = useState<string>(getRoute())
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/login'
    }
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  let Page: () => React.ReactElement
  switch (route) {
    case '/login':
      Page = SellerLogin
      break
    case '/dashboard':
      Page = SellerDashboard
      break
    case '/orders':
      Page = SellerOrders
      break
    default:
      Page = SellerLogin
      break
  }

  return (
    <AuthProvider>
      <div className="app" style={appStyle}>
        <Page />
      </div>
    </AuthProvider>
  )
}