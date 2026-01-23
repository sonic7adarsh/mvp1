import React, { useEffect, useState } from 'react'
import { RiderNavigator } from './navigation/RiderNavigator'
import './index.css'
import { RiderSessionProvider } from './state/riderSession'
import BottomNav from './components/BottomNav'

function getRoute(): string {
  const fullHash = window.location.hash || '#/login'
  const path = fullHash.split('?')[0]
  return path.replace(/^#/, '')
}

export default function App() {
  const appStyle: React.CSSProperties = {
    maxWidth: '390px',
    margin: '0 auto',
    background: '#FFFFFF',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
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

  return (
    <RiderSessionProvider>
      <div className="app" style={appStyle}>
        <RiderNavigator route={route} />
        {route !== '/login' && route !== '/onboarding' && <BottomNav route={route} />}
      </div>
    </RiderSessionProvider>
  )
}