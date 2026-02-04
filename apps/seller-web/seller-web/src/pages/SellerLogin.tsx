import React, { useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../api/client'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

export default function SellerLogin() {
  const { t } = useTranslation()
  const { login } = useAuth()

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
    boxSizing: 'border-box', // Prevent overflow
  }
  const otpInputStyle: React.CSSProperties = {
    ...inputStyle,
    marginTop: 12,
    maxWidth: 240, // Limit width for better aesthetics
    display: 'block',
    marginLeft: 'auto',
    marginRight: 'auto',
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    height: 50,
    borderRadius: 14,
    border: 'none',
    background: '#6E24B8',
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
  const [isRegistering, setIsRegistering] = useState(false)
  const [phoneFocused, setPhoneFocused] = useState(false)
  const [otpFocused, setOtpFocused] = useState(false)
  const [errorMsg, setErrorMsg] = useState<React.ReactNode>('')

  const sendOtp = async () => {
    if (loading) return
    setLoading(true)
    setErrorMsg('')
    try {
      await apiFetch<any>('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          role: 'SELLER',
          isRegistration: isRegistering 
        }),
      }, { jwt: '' })
      setOtpSent(true)
    } catch (e: any) {
      console.error('Seller send-otp error', e)
      const msg = e.message || ''
      
      // Intelligent redirection based on error
      if (isRegistering && msg.includes('Account already exists')) {
        setErrorMsg(
          <span>
            {t('login.errors.account_exists')} <span onClick={() => { setIsRegistering(false); setErrorMsg('') }} style={{ textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}>{t('login.errors.login_here')}</span>
          </span>
        )
      } else if (!isRegistering && msg.includes('Account not found')) {
        setErrorMsg(
          <span>
            {t('login.errors.account_not_found')} <span onClick={() => { setIsRegistering(true); setErrorMsg('') }} style={{ textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}>{t('login.errors.register_here')}</span>
          </span>
        )
      } else {
        setErrorMsg(msg || t('login.errors.send_failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (loading) return
    setLoading(true)
    setErrorMsg('')
    try {
      const data = await apiFetch<any>('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          otp, 
          role: 'SELLER',
          isRegistration: isRegistering 
        }),
      }, { jwt: '' })
      const token = data?.token
      const role = data?.user?.role
      if (!token || !role) {
        console.error('Seller verify-otp invalid response')
        setErrorMsg(t('login.errors.login_failed'))
        return
      }
      if (role !== 'SELLER') {
        console.error('Not a seller account')
        setErrorMsg(
          <span>
            {t('login.errors.not_seller')} <span onClick={() => { setIsRegistering(true); setOtpSent(false); setOtp(''); setErrorMsg('') }} style={{ textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}>{t('login.errors.register_as_seller')}</span>
          </span>
        )
        return
      }
      
      // Use AuthContext login to update state and persist token
      login(token, { id: data.user_id, roles: data.user?.roles || ['SELLER'] })
      
      if (data.onboardingRequired || isRegistering) {
        window.location.hash = '#/onboarding'
      } else {
        window.location.hash = '#/dashboard'
      }
    } catch (e: any) {
      console.error('Seller verify-otp error', e)
      const msg = e.message || ''
      if (
        msg.includes('Account not found') || 
        msg.includes('not registered') || 
        msg.includes('does not exist') ||
        e.code === 'ROLE_NOT_ASSIGNED'
      ) {
        setErrorMsg(
          <span>
            {t('login.errors.not_registered')} <span onClick={() => { setIsRegistering(true); setOtpSent(false); setOtp(''); setErrorMsg('') }} style={{ textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}>{t('login.errors.create_account')}</span>
          </span>
        )
      } else {
        setErrorMsg(msg || t('login.errors.verify_failed'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <LanguageSwitcher />
        </div>
        <div style={headingStyle}>
          <div style={titleStyle}>{isRegistering ? t('login.registration_title') : (otpSent ? t('login.verification_title') : t('login.login_title'))}</div>
          <div style={roleBadgeStyle}>{t('login.role_badge')}</div>
          <div style={subtitleStyle}>
            {otpSent 
              ? t('login.otp_sent_to', { phone })
              : (isRegistering ? t('login.create_account_subtitle') : t('login.login_subtitle'))
            }
          </div>
        </div>

        {!otpSent && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{t('login.mobile_number')}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ 
                width: 60, height: 48, borderRadius: 10, border: '1px solid #d1d5db', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', fontWeight: 600
              }}>
                +91
              </div>
              <input
                type="tel"
                placeholder={t('login.mobile_placeholder')}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setPhone(val)
                  setErrorMsg('')
                }}
                style={{ ...inputStyle, flex: 1, borderColor: phoneFocused ? 'var(--primary)' : '#d1d5db' }}
                disabled={otpSent || loading}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              />
            </div>
          </div>
        )}

        {otpSent && (
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder={t('login.otp_placeholder')}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              style={{ 
                ...otpInputStyle, 
                height: 44, // Reduced height
                marginTop: 8, // Reduced margin
                borderColor: otpFocused ? 'var(--primary)' : '#d1d5db', 
                textAlign: 'center', 
                letterSpacing: 4, 
                fontSize: 16, // Reduced font size
                fontWeight: 600 
              }}
              disabled={loading}
              onFocus={() => setOtpFocused(true)}
              onBlur={() => setOtpFocused(false)}
              autoFocus
            />
          </div>
        )}

        {errorMsg && (
          <div style={{ color: '#EF4444', fontSize: 13, marginTop: 10, background: '#FEF2F2', padding: '8px 12px', borderRadius: 8 }}>
            {errorMsg}
          </div>
        )}

        <button
          type="button"
          onClick={() => (otpSent ? verifyOtp() : sendOtp())}
          style={loading ? buttonDisabledStyle : buttonStyle}
          disabled={loading || (otpSent ? otp.length < 4 : phone.length < 10)}
        >
          {loading ? t('login.processing') : otpSent ? (isRegistering ? t('login.verify_register') : t('login.verify_continue')) : t('login.get_otp')}
        </button>

        {!otpSent && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            {isRegistering ? (
              <div style={{ fontSize: 14, color: '#555' }}>
                {t('login.already_have_account')}{' '}
                <span 
                  onClick={() => { setIsRegistering(false); setErrorMsg('') }} 
                  style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('login.login_here')}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#555' }}>
                {t('login.not_seller_yet')}{' '}
                <span 
                  onClick={() => { setIsRegistering(true); setErrorMsg('') }} 
                  style={{ color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}
                >
                  {t('login.register_as_seller_link')}
                </span>
              </div>
            )}
          </div>
        )}

        {!otpSent && (
          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
            {t('login.terms_privacy')}
          </div>
        )}
        
        {otpSent && (
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button 
              onClick={() => { setOtpSent(false); setOtp(''); setErrorMsg('') }}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t('login.change_mobile')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
