import React, { useEffect, useMemo, useState } from 'react'
import SafeContainer from '../components/SafeContainer'
import { riderApi } from '../services/riderApi'
import OtpInput from '../components/OtpInput'

type Status = 'RIDER_ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED'

export default function MyOrdersScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const sectionTitleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#1F1F1F', margin: '16px 0 8px' }
  const btnPrimary: React.CSSProperties = { height: 44, borderRadius: 12, border: 'none', background: '#6C2BD9', color: '#fff', fontWeight: 700 }
  const btnSecondary: React.CSSProperties = { height: 36, borderRadius: 10, border: '1px solid #E5E7EB', background: '#fff', color: '#111827', fontWeight: 700 }

  const [orders, setOrders] = useState<any[]>([])
  const [otpMap, setOtpMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(false)

  async function load() {
    try {
      setLoading(true)
      const resp = await riderApi.getMyOrders()
      setOrders((resp && (resp as any).orders) || [])
    } catch (e) {
      console.error('[MyOrders] load failed', e)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const grouped = useMemo(() => {
    const by: Record<Status, any[]> = {
      RIDER_ASSIGNED: [], PICKED_UP: [], OUT_FOR_DELIVERY: [], DELIVERED: [],
    }
    for (const o of orders) {
      const st = String(o.status) as Status
      if (st in by) by[st as Status].push(o)
    }
    return by
  }, [orders])

  function setOtp(orderId: string, next: string) {
    const cleaned = next.replace(/\D+/g, '').slice(0, 6)
    setOtpMap((m) => ({ ...m, [orderId]: cleaned }))
  }

  async function pickup(orderId: string) {
    try {
      await riderApi.pickupOrder(orderId)
    } catch (e) { console.error('Pickup failed', e) }
    await load()
  }

  async function start(orderId: string) {
    try {
      await riderApi.startDelivery(orderId)
    } catch (e) { console.error('Start delivery failed', e) }
    await load()
    // Optionally navigate to detail
    window.location.hash = `#/order/${orderId}`
  }

  async function deliver(orderId: string) {
    const otp = otpMap[orderId] || ''
    if (otp.length !== 6) return
    try {
      await riderApi.deliverOrder(orderId, otp)
    } catch (e) { console.error('Deliver failed', e) }
    await load()
  }

  function renderOrderCard(o: any, action: React.ReactNode) {
    return (
      <div key={o.orderId || o.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F' }}>Order #{o.orderId || o.id}</div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>{o.storeName || o.storeId || 'Store'}</div>
        </div>
        {action}
      </div>
    )
  }

  return (
    <SafeContainer>
      <div style={titleStyle}>My Orders</div>
      {loading && <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>Loading…</div></div>}

      <div style={sectionTitleStyle}>Assigned</div>
      {grouped.RIDER_ASSIGNED.length === 0 && <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>None</div></div>}
      {grouped.RIDER_ASSIGNED.map((o) => renderOrderCard(o, (
        <button style={btnPrimary} onClick={() => pickup(String(o.orderId || o.id))}>Pickup Order</button>
      )))}

      <div style={sectionTitleStyle}>Picked Up</div>
      {grouped.PICKED_UP.length === 0 && <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>None</div></div>}
      {grouped.PICKED_UP.map((o) => renderOrderCard(o, (
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnPrimary} onClick={() => start(String(o.orderId || o.id))}>Start Delivery</button>
          <button style={btnSecondary} onClick={() => window.location.hash = `#/order/${o.orderId || o.id}`}>Open Details</button>
        </div>
      )))}

      <div style={sectionTitleStyle}>Out For Delivery</div>
      {grouped.OUT_FOR_DELIVERY.length === 0 && <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>None</div></div>}
      {grouped.OUT_FOR_DELIVERY.map((o) => renderOrderCard(o, (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <OtpInput value={otpMap[String(o.orderId || o.id)] || ''} onChange={(v) => setOtp(String(o.orderId || o.id), v)} />
          <button style={{ ...btnPrimary, opacity: (otpMap[String(o.orderId || o.id)] || '').length === 6 ? 1 : 0.6 }} disabled={(otpMap[String(o.orderId || o.id)] || '').length !== 6} onClick={() => deliver(String(o.orderId || o.id))}>Deliver Order</button>
          <button style={btnSecondary} onClick={() => window.location.hash = `#/order/${o.orderId || o.id}`}>Open Details</button>
        </div>
      )))}

      <div style={sectionTitleStyle}>Delivered</div>
      {grouped.DELIVERED.length === 0 && <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>None</div></div>}
      {grouped.DELIVERED.map((o) => renderOrderCard(o, (
        <div style={{ color: '#6B7280', fontSize: 12 }}>Completed</div>
      )))}
    </SafeContainer>
  )
}