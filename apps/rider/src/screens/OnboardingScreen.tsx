import React, { useEffect, useState } from 'react'
import { riderApi } from '../services/riderApi'
import { useRiderSession } from '../state/riderSession'
import SafeContainer from '../components/SafeContainer'

export default function OnboardingScreen() {
  const { setJwt, setRoles } = useRiderSession()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  // Onboarding visibility is decided by backend roles; no local flag-based redirects

  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '20px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const headingStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 8,
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    padding: 12,
    fontSize: 15,
    outline: 'none',
    boxShadow: 'none',
    textDecoration: 'none',
    WebkitAppearance: 'none' as any,
    appearance: 'none' as any,
  }
  const labelStyle: React.CSSProperties = { fontSize: 13, color: '#6B7280', marginBottom: 6 }
  const buttonStyle: React.CSSProperties = { width: '100%', height: 52, borderRadius: 14, border: 'none', background: '#6C2BD9', color: '#fff', fontWeight: 700, marginTop: 16 }

  const submit = async () => {
    if (loading) return
    setLoading(true)
    try {
      const data = await riderApi.onboard({ name })
      const nextToken = (data && data.token) || ''
      if (nextToken) {
        try { localStorage.setItem('rider_token', nextToken) } catch {}
        setJwt(nextToken)
        // After onboarding, fetch user info and ensure active_role === RIDER
        try {
          const me = await riderApi.getMe()
          const active = me?.active_role
          const roles = me?.allowed_roles || []
          setRoles(active, roles)
          if (active === 'RIDER') {
            window.location.hash = '#/home'
          } else {
            // If backend hasn't switched role yet, stay on onboarding
            console.warn('Onboarding complete but active_role is not RIDER yet')
          }
        } catch (infoErr) {
          console.error('Failed to load user info after onboarding', infoErr)
        }
      }
    } catch (e) {
      console.error('[Onboarding] failed', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeContainer>
      <div style={cardStyle}>
        <div style={headingStyle}>Rider Onboarding</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={labelStyle}>Name</div>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <button type="button" style={buttonStyle} onClick={submit}>Complete Onboarding</button>
      </div>
    </SafeContainer>
  )
}