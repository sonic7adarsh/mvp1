import React from 'react'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Home from './pages/Home'
import Store from './pages/Store'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import CategoryProducts from './pages/CategoryProducts'
import SelectLocation from './pages/SelectLocation'
import './index.css'
import { CartProvider, useCart } from './CartContext'
import { AuthProvider, useAuth } from './AuthContext'
import { LocationProvider, useLocation } from './context/LocationContext'
import { useTranslation } from 'react-i18next'

function getRoute(): string {
  const fullHash = window.location.hash || '#/home'
  const path = fullHash.split('?')[0]
  return path.replace(/^#/, '')
}

function navigate(path: string) {
  window.location.hash = path
}

// Gated content wrapper
function Content() {
  const { t } = useTranslation()
  const [route, setRoute] = useState<string>(getRoute())
  const { location } = useLocation()
  const { isAuthenticated } = useAuth()
  
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/home'
    }
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Location Gating Logic
  const isPublicRoute = route === '/login' || route === '/select-location'
  
  if (!isPublicRoute && (!location || !location.confirmed)) {
    // Soft check - allow home but maybe show fallback UI there
    // No force redirect on app load
    if (route !== '/home' && route !== '/select-location') {
       // Only protect other routes if critical
    }
  }

  let Page: () => React.ReactElement

  if (route.startsWith('/category/')) {
     Page = CategoryProducts
  } else if (route.startsWith('/stores/')) {
    // Extract storeId if needed by Store page, or Store page can parse hash
    Page = Store
  } else {
    switch (route) {
      case '/login':
        Page = Login
        break
      case '/select-location':
        Page = SelectLocation
        break
      case '/home':
        Page = Home
        break
      case '/store':
        Page = Store
        break
      case '/cart':
        Page = Cart
        break
      case '/orders':
        Page = Orders
        break
      case '/profile':
        Page = Profile
        break
      default:
        Page = Home
        break
    }
  }

  const appStyle: React.CSSProperties = {
    maxWidth: '420px',
    margin: '0 auto',
    background: '#FFFFFF',
    height: '100dvh', // Use dynamic viewport height
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Prevent body scroll, let pages handle it
  }

  const bottomNavStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '420px',
    height: '80px', // Increased height
    background: '#c9f2f6', // Restored Light Blue (Cyan)
    borderTop: '1px solid #A5E0E6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
    zIndex: 50,
    paddingBottom: 'env(safe-area-inset-bottom)', // Ensure safe area support
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: '11px',
    fontWeight: active ? 700 : 600,
    color: '#000000', // Always black
    position: 'relative',
    opacity: active ? 1 : 0.7, // Contrast through opacity
  })

  const iconBoxStyle = (active: boolean): React.CSSProperties => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px', // Further reduced width (was 48px)
    height: '40px',
    borderRadius: '50%', // Circle shape
    background: active ? '#FFFFFF' : 'transparent', // Contrast background
    marginBottom: '4px',
    transition: 'background 0.2s ease',
  })

  function CartBadge() {
    const { items } = useCart()
    const count = items.reduce((sum, i) => sum + i.quantity, 0)
    if (count <= 0) return null
    const badgeStyle: React.CSSProperties = {
      position: 'absolute',
      top: -4,
      right: -4, // Tighter position for circle
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      background: '#000000', // Black badge
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 700,
      padding: '0 4px',
      border: '2px solid #FFFFFF',
      zIndex: 10
    }
    return <span style={badgeStyle}>{count}</span>
  }

  const isHome = route === '/home'
  const isOrders = route === '/orders'
  const isCart = route === '/cart'
  const isProfile = route === '/profile'
  
  const hideNav = route === '/select-location' || route === '/login' || isCart

  return (
    <div className="app" style={appStyle}>
      <Page />
      {!hideNav && (
        <nav className="bottom-nav" style={bottomNavStyle} role="navigation" aria-label="Primary">
          <a
            href="#/home"
            onClick={(e) => { e.preventDefault(); navigate('/home') }}
            style={tabStyle(isHome)}
            aria-current={isHome ? 'page' : undefined}
          >
            <div style={iconBoxStyle(isHome)}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <span>{t('nav.home')}</span>
          </a>
          <a
            href="#/cart"
            onClick={(e) => { e.preventDefault(); navigate('/cart') }}
            style={tabStyle(isCart)}
            aria-current={isCart ? 'page' : undefined}
          >
            <div style={iconBoxStyle(isCart)}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <CartBadge />
            </div>
            <span>{t('nav.cart')}</span>
          </a>
          <a
            href="#/orders"
            onClick={(e) => { e.preventDefault(); navigate('/orders') }}
            style={tabStyle(isOrders)}
            aria-current={isOrders ? 'page' : undefined}
          >
            <div style={iconBoxStyle(isOrders)}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <span>{t('nav.orders')}</span>
          </a>
          <a
            href="#/profile"
            onClick={(e) => { 
              e.preventDefault()
              if (!isAuthenticated) {
                navigate('/login?redirect=/profile')
              } else {
                navigate('/profile')
              }
            }}
            style={tabStyle(isProfile)}
            aria-current={isProfile ? 'page' : undefined}
          >
            <div style={iconBoxStyle(isProfile)}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <span>{t('nav.profile')}</span>
          </a>
        </nav>
      )}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <CartProvider>
          <Content />
        </CartProvider>
      </LocationProvider>
    </AuthProvider>
  )
}
