import { useState } from 'react'
import { apiFetch } from '../api/client'

export default function SellerLogin() {
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || ''

  const containerStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 420,
    margin: '0 auto',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9fafb',
  }

  const contentStyle: React.CSSProperties = {
    width: '100%',
    background: '#ffffff',
    borderRadius: 16,
    padding: '28px 24px',
  }

  const headingStyle: React.CSSProperties = {
    textAlign: 'left',
    marginBottom: 24,
  }
  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 700,
    color: '#111',
    lineHeight: 1.4,
  }
  const roleBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    marginTop: 8,
    padding: '4px 8px',
    borderRadius: 999,
    background: '#FEF3C7',
    color: '#92400E',
    fontSize: 12,
    fontWeight: 700,
  }
  const subtitleStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
    lineHeight: 1.4,
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 10,
    border: '1px solid #d1d5db',
    background: '#ffffff',
    padding: '0 14px',
    fontSize: 15,
  }
  const otpInputStyle: React.CSSProperties = {
    ...inputStyle,
    marginTop: 12,
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: 50,
    borderRadius: 14,
    border: 'none',
    background: '#4f46e5',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 24,
  }
  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.6,
    cursor: 'not-allowed',
  }

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [otpFocused, setOtpFocused] = useState(false)

  const sendOtp = async () => {
    if (loading) return
    setLoading(true)
    try {
      await apiFetch<any>('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      }, { jwt: '', tenant: tenant || '' })
      setOtpSent(true)
    } catch (e) {
      console.error('Seller send-otp error', e)
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (loading) return
    setLoading(true)
    try {
      const data = await apiFetch<any>('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      }, { jwt: '', tenant: tenant || '' })
      const token = data?.token
      const role = data?.user?.role
      if (!token || !role) {
        console.error('Seller verify-otp invalid response')
        return
      }
      if (role !== 'SELLER') {
        console.error('Not a seller account')
        return
      }
      try { localStorage.setItem('seller_token', token) } catch {}
      window.location.hash = '#/dashboard'
    } catch (e) {
      console.error('Seller verify-otp error', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headingStyle}>
          <div style={titleStyle}>Seller Login</div>
          <div style={roleBadgeStyle}>SELLER</div>
          <div style={subtitleStyle}>Login to manage your store and orders</div>
        </div>

        <input
          type="tel"
          placeholder="Enter mobile number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ ...inputStyle, borderColor: phoneFocused ? '#4f46e5' : '#d1d5db' }}
          disabled={otpSent || loading}
          onFocus={() => setPhoneFocused(true)}
          onBlur={() => setPhoneFocused(false)}
        />
        {otpSent && (
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            style={{ ...otpInputStyle, borderColor: otpFocused ? '#4f46e5' : '#d1d5db' }}
            disabled={loading}
            onFocus={() => setOtpFocused(true)}
            onBlur={() => setOtpFocused(false)}
          />
        )}
        <button
          type="button"
          onClick={() => (otpSent ? verifyOtp() : sendOtp())}
          style={loading ? buttonDisabledStyle : buttonStyle}
          disabled={loading}
        >
          {otpSent ? 'Verify OTP' : 'Send OTP'}
        </button>
      </div>
    </div>
  )
}