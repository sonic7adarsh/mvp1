import React, { useEffect, useState } from 'react'
import SafeContainer from '../components/SafeContainer'
import { riderApi } from '../services/riderApi'

export default function CompletedScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const subStyle: React.CSSProperties = { fontSize: 12, color: '#6B7280' }

  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(false)

  async function load() {
    try {
      setLoading(true)
      const resp = await riderApi.getCompletedOrders()
      const list = (resp && resp.deliveries) || []
      console.log('CompletedScreen list:', list)
      setOrders(list)
    } catch (e) { console.error('[Completed] load failed', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  return (
    <SafeContainer>
      <div style={titleStyle}>Completed</div>
      {loading && <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>Loading…</div></div>}
      {!loading && orders.length === 0 && (
        <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>No completed deliveries yet</div></div>
      )}
      {orders.map((o) => (
        <div key={o.deliveryId || o.id} style={{...cardStyle, marginBottom: 16}}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F' }}>Order #{o.orderId || o.id}</div>
            <div style={subStyle}>{o.storeName || o.storeId || 'Store'}</div>
          </div>
          <div style={{ marginTop: 8, color: '#6B7280', fontSize: 12 }}>Delivered</div>
        </div>
      ))}
    </SafeContainer>
  )
}