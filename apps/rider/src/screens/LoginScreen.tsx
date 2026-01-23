import React, { useState } from 'react'
import { riderApi } from '../services/riderApi'
import { useRiderSession } from '../state/riderSession'
import SafeContainer from '../components/SafeContainer'

export default function LoginScreen() {
  const { setJwt, setRoles } = useRiderSession()
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || ''

  const appNameStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { width: '100%', background: '#FFFFFF', borderRadius: 16, padding: '20px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: '#1F1F1F', lineHeight: 1.3 }
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
  const otpInputStyle: React.CSSProperties = { ...inputStyle, marginTop: 12 }
  const buttonStyle: React.CSSProperties = { width: '100%', height: 52, borderRadius: 14, border: 'none', background: '#6C2BD9', color: '#FFFFFF', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 20 }
  const buttonDisabledStyle: React.CSSProperties = { ...buttonStyle, opacity: 0.6, cursor: 'not-allowed' }

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const sendOtp = async () => {
    if (loading) return
    setLoading(true)
    try {
      await riderApi.sendOtp(phone)
      setOtpSent(true)
    } catch (e) {
      console.error('Rider send-otp error', e)
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (loading) return
    setLoading(true)
    try {
      const data = await riderApi.verifyOtp(phone, otp)
      const token = (data && data.token) || ''
      if (token) {
        try { localStorage.setItem('rider_token', token) } catch {}
        setJwt(token)
        // After login ALWAYS go to Orders tab; UI is backend-driven thereafter.
        try {
          const me = await riderApi.getMe()
          setRoles(me?.active_role, me?.allowed_roles || [])
        } catch (infoErr) {
          console.error('Failed to load user info after login', infoErr)
        }
        window.location.hash = '#/available'
      }
    } catch (e) {
      console.error('Rider verify-otp error', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeContainer center>
      <div style={appNameStyle}>Bharat Rider</div>
      <div style={cardStyle}>
        <div style={titleStyle}>Login</div>
        <div style={{ marginTop: 12 }}>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={10}
            placeholder="Phone number"
            value={phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
              setPhone(digits)
            }}
            style={inputStyle}
            disabled={otpSent || loading}
          />
        </div>
        {otpSent && (
          <div style={{ marginTop: 12 }}>
            <input type="text" placeholder="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} style={otpInputStyle} disabled={loading} />
          </div>
        )}
        <button
          type="button"
          onClick={() => (otpSent ? verifyOtp() : sendOtp())}
          style={loading || (!otpSent && phone.length !== 10) ? buttonDisabledStyle : buttonStyle}
          disabled={loading || (!otpSent && phone.length !== 10)}
        >
          {otpSent ? 'Verify OTP' : 'Send OTP'}
        </button>
      </div>
    </SafeContainer>
  )
}