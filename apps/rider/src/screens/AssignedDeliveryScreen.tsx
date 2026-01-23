import React, { useEffect, useState } from 'react'
import { riderApi } from '../services/riderApi'
import type { AssignedOrder } from '../services/riderApi'
import SafeContainer from '../components/SafeContainer'
import { useRiderSession } from '../state/riderSession'

export default function AssignedDeliveryScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const rowStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }
  const labelStyle: React.CSSProperties = { fontSize: 13, color: '#6B7280' }
  const btnStyle: React.CSSProperties = { height: 52, borderRadius: 14, border: 'none', background: '#6C2BD9', color: '#fff', fontWeight: 700, marginTop: 8, width: '100%' }

  const [order, setOrder] = useState<AssignedOrder | null>(null)
  const { setRoles } = useRiderSession()

  useEffect(() => {
    ;(async () => {
      try {
        const me = await riderApi.getMe()
        const active = me?.active_role
        const roles = me?.allowed_roles || []
        setRoles(active, roles)
        const isRider = active === 'RIDER'
        const canBeRider = roles.includes('RIDER')
        if (!isRider || !canBeRider) {
          window.location.hash = '#/onboarding'
          return
        }
        setOrder(await riderApi.getAssignedOrder())
      } catch (e) { console.error('[Assigned] role check/load failed', e) }
    })()
  }, [])

  const pickup = async () => {
    if (!order || !order.orderId) return
    try {
      await riderApi.pickupOrder(order.orderId)
      try { await riderApi.getAssignedDeliveries() } catch {}
      window.location.hash = '#/my-orders'
    } catch (e) {
      console.error('[Assigned] pickup failed', e)
    }
  }

  // Never auto-open in-progress; explicit actions drive navigation.

  return (
    <SafeContainer>
      <div style={titleStyle}>Assigned Delivery</div>
      <div style={cardStyle}>
        <div style={rowStyle}>
          <div><span style={labelStyle}>Order ID</span><div>{order?.orderId || '-'}</div></div>
          <div><span style={labelStyle}>Store ID</span><div>{order?.storeId || '-'}</div></div>
          {order?.status === 'RIDER_ASSIGNED' && (
            <button type="button" style={btnStyle} onClick={pickup}>Pickup Order</button>
          )}
          {order?.status === 'PICKED_UP' && (
            <button type="button" style={btnStyle} onClick={() => { window.location.hash = `#/order/${order?.orderId}` }}>Continue Delivery</button>
          )}
        </div>
      </div>
    </SafeContainer>
  )
}