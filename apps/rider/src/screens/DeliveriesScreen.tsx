import React, { useEffect, useMemo, useState } from 'react'
import SafeContainer from '../components/SafeContainer'
import { riderApi } from '../services/riderApi'
import OtpInput from '../components/OtpInput'

type Status = 'RIDER_ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED'

export default function DeliveriesScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const sectionTitleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#1F1F1F', margin: '16px 0 8px' }
  const btnPrimary: React.CSSProperties = { width: '100%', height: 44, borderRadius: 12, border: 'none', background: '#6C2BD9', color: '#fff', fontWeight: 700 }
  const subStyle: React.CSSProperties = { fontSize: 12, color: '#6B7280' }

  const [orders, setOrders] = useState<any[]>([])
  const [otpMap, setOtpMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<boolean>(false)

  async function load() {
    try {
      setLoading(true)
      const resp = await riderApi.getActiveOrders()
      // Set from deliveries per spec
      setOrders((resp && (resp as any).deliveries) || [])
    } catch (e) {
      console.error('[Deliveries] load failed', e)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  // In-progress filter per spec
  const inProgressOrders = useMemo(() => {
    return orders.filter((o) => ['RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(String(o.status)))
  }, [orders])

  function setOtp(orderId: string, next: string) {
    const cleaned = next.replace(/\D+/g, '').slice(0, 6)
    setOtpMap((m) => ({ ...m, [orderId]: cleaned }))
  }

  async function handlePickup(order: any) {
    const deliveryId = String(order.deliveryId || '')
    if (!deliveryId) { console.error('Missing deliveryId', order); return }
    try { await riderApi.pickupDelivery(deliveryId) } catch (e) { console.error('Pickup failed', e) }
    await load()
  }
  async function start(deliveryId: string) {
    try {
      await riderApi.startDelivery(deliveryId)
      // toast success not available here, but we can log
      console.log('OTP sent to customer')
    } catch (e: any) { console.error('Start delivery failed', e) }
    await load()
  }
  async function onCompleteDelivery(deliveryId: string) {
    const otp = otpMap[deliveryId] || ''
    try { await riderApi.completeDelivery(deliveryId, otp) } catch (e) { console.error('Deliver failed', e) }
    await load()
  }

  function renderOrder(o: any, action: React.ReactNode) {
    return (
      <div key={o.orderId || o.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F' }}>Order #{o.orderId || o.id}</div>
          <div style={subStyle}>{o.storeName || o.storeId || 'Store'}</div>
        </div>
        {action}
      </div>
    )
  }

  return (
    <SafeContainer>
      <div style={titleStyle}>Deliveries</div>
      {loading && <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>Loading…</div></div>}
      {!loading && inProgressOrders.length === 0 && (
        <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>No active deliveries</div></div>
      )}
      {!loading && inProgressOrders.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {inProgressOrders.map((order: any) => (
            <div key={order.deliveryId || order.orderId || order.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F' }}>Order #{order.orderId || order.id}</div>
                <div style={subStyle}>{order.storeName || order.storeId || 'Store'}</div>
              </div>
              {String(order.status) === 'RIDER_ASSIGNED' && (
                <button style={btnPrimary} onClick={() => handlePickup(order)}>Pick Up Order</button>
              )}
              {String(order.status) === 'PICKED_UP' && (
                <button style={btnPrimary} onClick={() => start(String(order.deliveryId || ''))}>Start Delivery</button>
              )}
              {String(order.status) === 'OUT_FOR_DELIVERY' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <OtpInput value={otpMap[String(order.deliveryId || order.orderId)] || ''} onChange={(v) => setOtp(String(order.deliveryId || order.orderId), v)} />
                  <button style={{ ...btnPrimary, opacity: (otpMap[String(order.deliveryId || order.orderId)] || '').length === 6 ? 1 : 0.6 }} disabled={(otpMap[String(order.deliveryId || order.orderId)] || '').length !== 6} onClick={() => onCompleteDelivery(String(order.deliveryId || order.orderId))}>Complete Delivery</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </SafeContainer>
  )
}