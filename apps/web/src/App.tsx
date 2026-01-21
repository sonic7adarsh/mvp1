import React from 'react'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Home from './pages/Home'
import Store from './pages/Store'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import './index.css'
import { CartProvider, useCart } from './CartContext'
import { AuthProvider } from './AuthContext'

function getRoute(): string {
  const fullHash = window.location.hash || '#/home'
  const path = fullHash.split('?')[0]
  return path.replace(/^#/, '')
}

function navigate(path: string) {
  window.location.hash = path
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

  const bottomNavStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '420px',
    height: '56px',
    background: '#FFFFFF',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
    zIndex: 30,
  }
  const [route, setRoute] = useState<string>(getRoute())

  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = '/home'
    }
    const onHashChange = () => setRoute(getRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  let Page: () => React.ReactElement
  switch (route) {
    case '/login':
      Page = Login
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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textDecoration: 'none',
    fontSize: '11px',
    fontWeight: 500,
    color: active ? '#1AA6A6' : '#666666',
    position: 'relative',
  })

  const iconStyle = (active: boolean): React.CSSProperties => ({
    fontSize: '20px',
    marginBottom: '2px',
    lineHeight: 1,
    color: active ? '#1AA6A6' : '#666666',
  })

  function CartBadge() {
    const { items } = useCart()
    const count = items.reduce((sum, i) => sum + i.quantity, 0)
    if (count <= 0) return null
    const badgeStyle: React.CSSProperties = {
      position: 'absolute',
      top: 8,
      right: 14,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      background: '#1AA6A6',
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 10,
      fontWeight: 700,
      padding: '0 4px',
    }
    return <span style={badgeStyle}>{count}</span>
  }

  const isHome = route === '/home'
  const isOrders = route === '/orders'
  const isCart = route === '/cart'
  const isProfile = route === '/profile'
  const isSeller = false

  return (
    <AuthProvider>
      <CartProvider>
        <div className="app" style={appStyle}>
          <Page />
          {(!isSeller) && (
          <nav className="bottom-nav" style={bottomNavStyle} role="navigation" aria-label="Primary">
          <a
            href="#/home"
            onClick={(e) => { e.preventDefault(); navigate('/home') }}
            style={tabStyle(isHome)}
            aria-current={isHome ? 'page' : undefined}
          >
            <span style={iconStyle(isHome)}>🏠</span>
            <span>Home</span>
          </a>
          <a
            href="#/cart"
            onClick={(e) => { e.preventDefault(); navigate('/cart') }}
            style={tabStyle(isCart)}
            aria-current={isCart ? 'page' : undefined}
          >
            <span style={iconStyle(isCart)}>🛒</span>
            <span>Cart</span>
            <CartBadge />
          </a>
            <a
              href="#/orders"
              onClick={(e) => { e.preventDefault(); navigate('/orders') }}
              style={tabStyle(isOrders)}
              aria-current={isOrders ? 'page' : undefined}
            >
              <span style={iconStyle(isOrders)}>🧾</span>
              <span>Orders</span>
            </a>
            <a
              href="#/profile"
              onClick={(e) => { e.preventDefault(); navigate('/profile') }}
              style={tabStyle(isProfile)}
              aria-current={isProfile ? 'page' : undefined}
            >
              <span style={iconStyle(isProfile)}>👤</span>
              <span>Profile</span>
            </a>
          </nav>
          )}
        </div>
      </CartProvider>
    </AuthProvider>
  )
}
