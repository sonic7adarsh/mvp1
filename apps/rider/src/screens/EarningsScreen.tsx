import React, { useEffect, useState } from 'react'
import { riderApi } from '../services/riderApi'
import SafeContainer from '../components/SafeContainer'

export default function EarningsScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }

  const [today, setToday] = useState<{ total: number; currency?: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      try { setToday(await riderApi.getTodayEarnings()) } catch (e) { console.error('[Earnings] load failed', e) }
    })()
  }, [])

  return (
    <SafeContainer>
      <div style={titleStyle}>Earnings</div>
      <div style={cardStyle}>
        {today ? (
          <div style={{ fontSize: 16, fontWeight: 700 }}>Today: {(today.currency || '₹')}{today.total}</div>
        ) : (
          <div style={{ color: '#6B7280', fontSize: 14 }}>No earnings yet</div>
        )}
      </div>
    </SafeContainer>
  )
}