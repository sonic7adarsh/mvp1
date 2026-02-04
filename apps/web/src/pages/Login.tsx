import { useEffect, useRef, useState } from 'react'
import { sendOtp, verifyOtp } from '../api/endpoints'
import { handleApiError } from '../api/client'
import { useAuth } from '../AuthContext'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export default function Login() {
  const { t } = useTranslation()
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
      setResendSeconds(120)
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
        setError(t('login.invalid_phone'))
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
      setError(t('login.enter_otp_error'))
      return
    }
    try {
      setLoading(true)
      setError('')
      const res = await verifyOtp(phone, otp)
      // Support both backend shapes: { accessToken } or { token }
      const token = (res as any).accessToken || (res as any).token
      const roles = (res as any).user?.roles || ((res as any).role ? [String((res as any).role)] : undefined)
      const userId = (res as any).user?.id || (res as any).userId || (res as any).id
      
      // Persist and set global auth
      localStorage.setItem('customer_token', token)
      login(token, { roles, id: userId })
      
      // Check for redirect param
      const hashParts = window.location.hash.split('?')
      let redirectTarget = '/home'
      
      if (hashParts.length > 1) {
        const params = new URLSearchParams(hashParts[1])
        const redirect = params.get('redirect')
        if (redirect) {
            redirectTarget = redirect
        }
      }
      
      // Redirect
      window.location.hash = redirectTarget
    } catch (e) {
      setError(handleApiError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleResend = () => {
    if (resendSeconds > 0) return
    setResendSeconds(120)
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
    position: 'relative',
  }

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    margin: 0,
    marginTop: '16px',
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
    background: '#000000',
    color: '#FFFFFF',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
  }

  const buttonDisabledStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#333333',
    cursor: 'not-allowed',
    opacity: 0.8,
  }

  const footerStyle: React.CSSProperties = {
    marginTop: '12px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#9CA3AF',
  }

  const skipStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#000000', 
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: '20px',
    width: '100%',
    textAlign: 'center',
    display: 'block',
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

  const langSwitcherStyle: React.CSSProperties = {
    position: 'absolute',
    top: '24px',
    right: '24px',
    zIndex: 10,
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={langSwitcherStyle}>
          <LanguageSwitcher />
        </div>
        <div style={sectionStyle}>
          <h1 style={titleStyle}>BharatShop</h1>
          <p style={taglineStyle}>{t('login.tagline')}</p>
        </div>

        <div style={formStyle}>
          {/* Phone input */}
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder={t('login.phone_placeholder')}
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
              {loading ? t('login.sending') : t('login.send_otp')}
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
                placeholder={t('login.otp_placeholder')}
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
                {loading ? t('login.verifying') : t('login.verify_continue')}
              </button>
              <button
                type="button"
                onClick={handleResend}
                style={resendStyle}
                disabled={resendSeconds > 0}
              >
                {resendSeconds > 0 ? t('login.resend_otp_in', { seconds: resendSeconds }) : t('login.resend_otp')}
              </button>
            </>
          )}
        </div>

        <div style={footerStyle}>
          {t('login.terms_agreement')}
        </div>

        <button 
          onClick={() => window.location.hash = '/home'} 
          style={skipStyle}
        >
          {t('login.skip_to_home')}
        </button>
      </div>
    </div>
  )
}