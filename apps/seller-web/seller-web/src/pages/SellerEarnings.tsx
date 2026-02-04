import { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../api/client'
import { Banknote, ArrowLeft, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function SellerEarnings() {
  const { t } = useTranslation()
  const { jwt } = useAuth()
  const [earnings, setEarnings] = useState(0)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (jwt) fetchEarnings()
  }, [jwt])

  const fetchEarnings = async () => {
    try {
      setLoading(true)
      const res = await apiFetch<any>('/api/seller/dashboard-stats', {}, { jwt })
      setEarnings(res.earnings || 0)
    } catch (e) {
      console.error('Failed to fetch earnings', e)
    } finally {
      setLoading(false)
    }
  }

  const headerStyle: React.CSSProperties = {
    padding: '16px',
    background: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 12
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 16,
    boxShadow: 'var(--shadow-card)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
  }

  return (
    <div style={{ paddingBottom: 80, minHeight: '100vh', background: 'var(--bg-color)' }}>
      <div style={headerStyle}>
        <button onClick={() => window.location.hash = '/dashboard'} style={{ background: 'none', border: 'none', padding: 0 }}>
            <ArrowLeft size={24} color="var(--text-primary)" />
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{t('earnings.title')}</h1>
      </div>

      <div style={cardStyle}>
        <div style={{ width: 64, height: 64, borderRadius: 32, background: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Banknote size={32} />
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t('earnings.total_earnings')}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color: 'var(--text-primary)' }}>
            {loading ? '...' : `₹${earnings}`}
        </div>
        <div style={{ fontSize: 13, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4, background: '#ECFDF5', padding: '4px 12px', borderRadius: 20 }}>
            <TrendingUp size={14} /> +12% {t('earnings.this_week')}
        </div>
      </div>

      {/* Payouts and Statement section removed as per requirement */}

    </div>
  )
}
