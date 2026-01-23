import React, { useEffect, useState } from 'react'
import SafeContainer from '../components/SafeContainer'
import { riderApi } from '../services/riderApi'
import OtpInput from '../components/OtpInput'

export default function OrderDetailScreen({ orderId }: { orderId: string }) {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const labelStyle: React.CSSProperties = { fontSize: 12, color: '#6B7280' }
  const btnPrimary: React.CSSProperties = { height: 44, borderRadius: 12, border: 'none', background: '#6C2BD9', color: '#fff', fontWeight: 700, width: '100%' }

  const [order, setOrder] = useState<any | null>(null)
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState<boolean>(false)

  async function load() {
    try {
      setLoading(true)
      const resp = await riderApi.getMyOrders()
      const list = (resp && (resp as any).orders) || []
      const found = list.find((o: any) => String(o.orderId || o.id) === String(orderId)) || null
      setOrder(found)
    } catch (e) { console.error('[OrderDetail] load failed', e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [orderId])

  const canDeliver = otp.length === 6

  async function pickup() {
    if (!order) return
    try { await riderApi.pickupOrder(String(order.orderId || order.id)) } catch (e) { console.error('Pickup failed', e) }
    await load()
  }

  async function startDelivery() {
    if (!order) return
    try { await riderApi.startDelivery(String(order.orderId || order.id)) } catch (e) { console.error('Start failed', e) }
    await load()
  }

  async function deliver() {
    if (!order) return
    if (!canDeliver) return
    try { await riderApi.deliverOrder(String(order.orderId || order.id), otp) } catch (e) { console.error('Deliver failed', e) }
    await load()
  }

  return (
    <SafeContainer>
      <div style={titleStyle}>Order #{orderId}</div>
      {loading && <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>Loading…</div></div>}
      {!loading && !order && <div style={cardStyle}><div style={{ color: '#6B7280', fontSize: 14 }}>Order not found</div></div>}
      {!!order && (
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F' }}>Order #{order.orderId || order.id}</div>
            <div style={labelStyle}>{order.storeName || order.storeId || 'Store'}</div>
          </div>
          {order.status === 'RIDER_ASSIGNED' && (
            <button style={btnPrimary} onClick={pickup}>Pickup Order</button>
          )}
          {order.status === 'PICKED_UP' && (
            <button style={btnPrimary} onClick={startDelivery}>Start Delivery</button>
          )}
          {order.status === 'OUT_FOR_DELIVERY' && (
            <>
              <OtpInput value={otp} onChange={setOtp} />
              <button style={{ ...btnPrimary, opacity: canDeliver ? 1 : 0.6 }} disabled={!canDeliver} onClick={deliver}>Deliver Order</button>
            </>
          )}
          {order.status === 'DELIVERED' && (
            <div style={{ color: '#6B7280', fontSize: 14 }}>Delivered</div>
          )}
        </div>
      )}
    </SafeContainer>
  )
}