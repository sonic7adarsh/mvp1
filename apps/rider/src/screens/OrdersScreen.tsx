import React, { useEffect, useState } from 'react'
import SafeContainer from '../components/SafeContainer'
import { riderApi } from '../services/riderApi'

export default function OrdersScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }
  const btnStyle: React.CSSProperties = { width: '100%', height: 44, borderRadius: 12, border: 'none', background: '#16A34A', color: '#fff', fontWeight: 700 }
  const subStyle: React.CSSProperties = { fontSize: 12, color: '#6B7280' }

  const [orders, setOrders] = useState<any[]>([])
  const [toast, setToast] = useState<string>('')

  async function load() {
    try {
      const resp = await riderApi.getAvailableOrders()
      setOrders((resp && (resp as any).orders) || [])
    } catch (e) { console.error('[Orders] load failed', e) }
  }

  useEffect(() => { load() }, [])

  async function accept(o: any) {
    const deliveryId = String(o.deliveryId || o.id)
    try {
      await riderApi.acceptOrder(deliveryId)
      // Mandatory: re-fetch backend truth for active orders
      try { await riderApi.getActiveOrders() } catch {}
      // Remove from list without auto-navigation
      setOrders((prev) => prev.filter((x) => String(x.deliveryId || x.id) !== deliveryId))
    } catch (e: any) {
      if (e && typeof e === 'object' && 'status' in e && e.status === 409) {
        setToast('Order already taken')
        setTimeout(() => setToast(''), 2500)
      } else {
        console.error('Accept failed', e)
      }
    }
  }

  return (
    <SafeContainer>
      <div style={titleStyle}>Orders</div>
      {toast && <div style={{ ...cardStyle, color: '#111827' }}>{toast}</div>}
      {orders.length === 0 && (
        <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>New orders will appear here</div></div>
      )}
      {orders.map((o) => (
        <div key={o.deliveryId || o.id} style={{ ...cardStyle, ...sectionStyle }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F' }}>Order #{o.orderId || o.id}</div>
            <div style={subStyle}>{o.storeName || o.storeId || 'Store'}</div>
          </div>
          <button style={btnStyle} onClick={() => accept(o)}>Accept Order</button>
        </div>
      ))}
    </SafeContainer>
  )
}