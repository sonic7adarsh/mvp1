import React, { useEffect, useMemo, useState } from 'react'
import SafeContainer from '../components/SafeContainer'
import { riderApi } from '../services/riderApi'
import OtpInput from '../components/OtpInput'

type Status = 'RIDER_ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED'

export default function MyOrdersScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const sectionTitleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#1F1F1F', margin: '16px 0 8px' }
  const btnPrimary: React.CSSProperties = { height: 44, borderRadius: 12, border: 'none', background: '#6C2BD9', color: '#fff', fontWeight: 700, width: '100%', marginTop: 12 }
  const btnSecondary: React.CSSProperties = { height: 44, borderRadius: 12, border: '1px solid #E5E7EB', background: '#fff', color: '#111827', fontWeight: 700, width: '100%', marginTop: 12 }
  const tabContainerStyle: React.CSSProperties = { display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 16 }
  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    textAlign: 'center',
    padding: '12px 0',
    fontSize: 14,
    fontWeight: 600,
    color: active ? '#6C2BD9' : '#6B7280',
    borderBottom: active ? '2px solid #6C2BD9' : 'none',
    cursor: 'pointer',
  })
  const errorStyle: React.CSSProperties = { fontSize: 12, color: '#DC2626', marginTop: 4 }

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [orders, setOrders] = useState<any[]>([])
  const [completedList, setCompletedList] = useState<any[]>([])
  const [otpMap, setOtpMap] = useState<Record<string, string>>({})
  const [errorMap, setErrorMap] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  async function load() {
    try {
      setLoading(true)
      // Fetch both active and completed orders
      const [activeResp, completedResp] = await Promise.all([
        riderApi.getMyOrders(),
        riderApi.getCompletedOrders()
      ])
      
      setOrders((activeResp && (activeResp as any).orders) || [])
      
      // Data Path Fix: ensure we access .deliveries
      const history = (completedResp && completedResp.deliveries) || []
      setCompletedList(history)
      console.log('Completed orders:', history)
      
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

  const activeOrders = [...grouped.RIDER_ASSIGNED, ...grouped.PICKED_UP, ...grouped.OUT_FOR_DELIVERY]
  const completedOrders = completedList // Use fetched list directly, no local filtering
  
  const STATUS_LABEL = {
    READY: 'Ready',
    RIDER_ASSIGNED: 'Assigned',
    PICKED_UP: 'Picked Up',
    OUT_FOR_DELIVERY: 'On the way',
    DELIVERED: 'Delivered',
  }

  function setOtp(id: string, next: string) {
    const cleaned = next.replace(/\D+/g, '').slice(0, 6)
    setOtpMap((m) => ({ ...m, [id]: cleaned }))
    // Clear error when user types
    if (errorMap[id]) setErrorMap((m) => ({ ...m, [id]: '' }))
  }

  async function pickup(deliveryId: string) {
    try {
      await riderApi.pickupDelivery(deliveryId)
      await load()
    } catch (e) { console.error('Pickup failed', e) }
  }

  async function start(deliveryId: string) {
    try {
      await riderApi.startDelivery(deliveryId)
      showToast('OTP sent to customer')
      await load()
    } catch (e: any) {
      console.error('Start delivery failed', e)
      showToast(e.message || 'Failed to start delivery')
    }
  }

  async function onCompleteDelivery(deliveryId: string) {
    const otp = otpMap[deliveryId] || ''
    try {
      await riderApi.completeDelivery(deliveryId, otp)
      showToast('Delivery completed')
      setOtpMap((m) => ({ ...m, [deliveryId]: '' }))
      await load()
    } catch (e: any) {
      console.error('Deliver failed', e)
      const msg = e?.message || 'Invalid OTP'
      setErrorMap((m) => ({ ...m, [deliveryId]: msg }))
      showToast(msg)
    }
  }

  function renderOrderCard(o: any) {
    const id = String(o.deliveryId || o.id)
    const status = o.status as Status
    const otp = otpMap[id] || ''
    const error = errorMap[id]

    return (
      <div key={id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F' }}>Order #{o.orderId || o.id}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{o.storeName || o.storeId || 'Store'}</div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#6C2BD9', padding: '4px 8px', background: '#F3E8FF', borderRadius: 4, height: 'fit-content' }}>
            {status.replace(/_/g, ' ')}
          </div>
        </div>

        {status === 'RIDER_ASSIGNED' && (
          <button style={btnPrimary} onClick={() => pickup(id)}>Pick Up Order</button>
        )}

        {status === 'PICKED_UP' && (
          <button style={btnPrimary} onClick={() => start(id)}>Start Delivery</button>
        )}

        {status === 'OUT_FOR_DELIVERY' && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 14, marginBottom: 8, color: '#374151' }}>Enter Delivery OTP</div>
            <OtpInput value={otp} onChange={(v) => setOtp(id, v)} autoFocus={true} />
            {error && <div style={errorStyle}>{error}</div>}
            <button 
              style={{ ...btnPrimary, opacity: otp.length === 6 ? 1 : 0.6 }} 
              disabled={otp.length !== 6} 
              onClick={() => onCompleteDelivery(id)}
            >
              Complete Delivery
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <SafeContainer>
      <div style={titleStyle}>My Deliveries</div>
      
      {toast && (
        <div style={{ 
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)', 
          background: '#16A34A', color: '#fff', padding: '12px 24px', borderRadius: 24, 
          fontSize: 14, fontWeight: 600, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', zIndex: 100 
        }}>
          {toast}
        </div>
      )}

      <div style={tabContainerStyle}>
        <div style={tabStyle(activeTab === 'active')} onClick={() => setActiveTab('active')}>In Progress</div>
        <div style={tabStyle(activeTab === 'completed')} onClick={() => setActiveTab('completed')}>Completed</div>
      </div>

      {loading && <div style={{ ...cardStyle, textAlign: 'center', color: '#6B7280' }}>Loading…</div>}

      {!loading && activeTab === 'active' && (
        <>
          {activeOrders.length === 0 && <div style={{ ...cardStyle, textAlign: 'center', color: '#6B7280' }}>No active deliveries</div>}
          {activeOrders.map(renderOrderCard)}
        </>
      )}

      {!loading && activeTab === 'completed' && (
        <>
          {completedOrders.length === 0 && <div style={{ ...cardStyle, textAlign: 'center', color: '#6B7280' }}>No completed deliveries</div>}
          {completedOrders.map((o) => (
             <div key={o.deliveryId || o.id} style={{ ...cardStyle, marginBottom: 16 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <div>
                   <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F' }}>Order #{o.orderId || o.id}</div>
                   <div style={{ fontSize: 12, color: '#6B7280' }}>{o.storeName || o.storeId || 'Store'}</div>
                 </div>
                 <div style={{ fontSize: 12, fontWeight: 600, color: '#059669', padding: '4px 8px', background: '#D1FAE5', borderRadius: 4, height: 'fit-content' }}>
                   DELIVERED
                 </div>
               </div>
               <div style={{ fontSize: 12, color: '#6B7280', marginTop: 8 }}>
                 Delivered at: {o.updatedAt ? new Date(o.updatedAt).toLocaleTimeString() : '-'}
               </div>
             </div>
          ))}
        </>
      )}
    </SafeContainer>
  )
}