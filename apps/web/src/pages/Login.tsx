import { useEffect, useRef, useState } from 'react'
import { sendOtp, verifyOtp } from '../api/endpoints'
import { handleApiError } from '../api/client'
import { useAuth } from '../AuthContext'

export default function Login() {
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const otpInputRef = useRef<HTMLInputElement>(null)
  const { login } = useAuth()

  useEffect(() => {
    if (otpSent) {
      setResendSeconds(30)
      setTimeout(() => {
        otpInputRef.current?.focus()
      }, 0)
    }
  }, [otpSent])

  useEffect(() => {
    if (resendSeconds <= 0) return
    const interval = setInterval(() => {
      setResendSeconds((s) => (s > 0 ? s - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [resendSeconds])

  const sanitizeDigits = (value: string) => value.replace(/\D+/g, '')

  const onPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeDigits(e.target.value).slice(0, 10)
    setPhone(next)
    if (error) setError('')
  }

  const onOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = sanitizeDigits(e.target.value).slice(0, 6)
    setOtp(next)
    if (error) setError('')
  }

  const canSendOtp = phone.length === 10

  const handlePrimaryClick = async () => {
    if (loading) return
    if (!otpSent) {
      if (!canSendOtp) {
        setError('Please enter a valid 10-digit mobile number')
        return
      }
      try {
        setLoading(true)
        setError('')
        await sendOtp(phone)
        setOtpSent(true)
      } catch (e) {
        setError(handleApiError(e))
      } finally {
        setLoading(false)
      }
      return
    }
    // Verify & Continue
    if (!otp || otp.length === 0) {
      setError('Please enter OTP')
      return
    }
    try {
      setLoading(true)
      setError('')
      const res = await verifyOtp(phone, otp)
      // Support both backend shapes: { accessToken } or { token }
      const token = (res as any).accessToken || (res as any).token
      const roles = (res as any).user?.roles || ((res as any).role ? [String((res as any).role)] : undefined)
      // Persist and set global auth
      localStorage.setItem('customer_token', token)
      login(token, { roles })
      // Redirect to home
      window.location.hash = '/home'
    } catch (e) {
      setError(handleApiError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    if (resendSeconds > 0) return
    setResendSeconds(30)
    setError('')
    setOtp('')
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
  }

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '360px',
    padding: '24px',
    background: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    margin: 0,
  }

  const taglineStyle: React.CSSProperties = {
    marginTop: '6px',
    fontSize: '14px',
    color: '#6B7280',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    padding: '0 12px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const errorInputStyle: React.CSSProperties = {
    ...inputStyle,
    border: '1px solid #EF4444',
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: '48px',
    borderRadius: '12px',
    background: '#00B761',
    color: '#FFFFFF',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  }

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#9EE7C5',
    cursor: 'not-allowed',
    opacity: 0.8,
  }

  const footerStyle: React.CSSProperties = {
    marginTop: '12px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#9CA3AF',
  }

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  }

  const formStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  }

  const errorTextStyle: React.CSSProperties = {
    marginTop: '6px',
    color: '#EF4444',
    fontSize: '12px',
  }

  const resendStyle: React.CSSProperties = {
    marginTop: '4px',
    background: 'transparent',
    border: 'none',
    color: '#6B7280',
    fontSize: '14px',
    padding: 0,
    textAlign: 'left',
    cursor: resendSeconds > 0 ? 'not-allowed' : 'pointer',
  }

  const phoneErrorActive = !otpSent && !!error
  const otpErrorActive = otpSent && !!error

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={sectionStyle}>
          <h1 style={titleStyle}>BharatShop</h1>
          <p style={taglineStyle}>Groceries from nearby stores in minutes</p>
        </div>

        <div style={formStyle}>
          {/* Phone input */}
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Enter mobile number"
            value={phone}
            onChange={onPhoneChange}
            maxLength={10}
            style={phoneErrorActive ? errorInputStyle : inputStyle}
            aria-label="Mobile number"
          />
          {!otpSent && (
            <button
              type="button"
              onClick={handlePrimaryClick}
              style={canSendOtp && !loading ? buttonStyle : buttonDisabledStyle}
              disabled={!canSendOtp || loading}
            >
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          )}
          {phoneErrorActive && !otpSent && (
            <div style={errorTextStyle}>{error}</div>
          )}

          {/* OTP stage */}
          {otpSent && (
            <>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Enter OTP"
                value={otp}
                onChange={onOtpChange}
                maxLength={6}
                style={otpErrorActive ? errorInputStyle : inputStyle}
                aria-label="OTP"
                ref={otpInputRef}
              />
              {otpErrorActive && <div style={errorTextStyle}>{error}</div>}
              <button
                type="button"
                onClick={handlePrimaryClick}
                style={!loading ? buttonStyle : buttonDisabledStyle}
                disabled={loading}
              >
                {loading ? 'Verifying…' : 'Verify & Continue'}
              </button>
              <button
                type="button"
                onClick={handleResend}
                style={resendStyle}
                disabled={resendSeconds > 0}
              >
                {resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}
              </button>
            </>
          )}
        </div>

        <div style={footerStyle}>
          By continuing, you agree to our Terms & Privacy Policy
        </div>
      </div>
    </div>
  )
}