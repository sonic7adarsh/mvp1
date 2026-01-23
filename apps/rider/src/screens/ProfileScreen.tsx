import React, { useEffect, useState } from 'react'
import SafeContainer from '../components/SafeContainer'
import { riderApi } from '../services/riderApi'
import AvailabilityToggle from '../components/AvailabilityToggle'

export default function ProfileScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const rowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#6B7280' }
  const btnStyle: React.CSSProperties = { height: 44, borderRadius: 12, border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700 }

  const [info, setInfo] = useState<any | null>(null)

  useEffect(() => {
    ;(async () => {
      try { setInfo(await riderApi.getMe()) } catch (e) { console.error('[Profile] load failed', e) }
    })()
  }, [])

  function logout() {
    try { localStorage.removeItem('rider_token') } catch {}
    window.location.hash = '/login'
  }

  return (
    <SafeContainer>
      <div style={titleStyle}>Profile</div>
      <div style={{ ...cardStyle, ...rowStyle }}>
        <div>
          <div style={labelStyle}>Name</div>
          <div>{info?.name || '-'}</div>
        </div>
        <div>
          <div style={labelStyle}>Phone</div>
          <div>{info?.phone || '-'}</div>
        </div>
        <div>
          <div style={labelStyle}>Active Role</div>
          <div>RIDER</div>
        </div>
        <div>
          <div style={labelStyle}>Availability</div>
          <AvailabilityToggle />
        </div>
        <button style={btnStyle} onClick={logout}>Logout</button>
      </div>
    </SafeContainer>
  )
}