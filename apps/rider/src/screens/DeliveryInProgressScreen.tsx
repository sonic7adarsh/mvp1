import React, { useEffect, useState } from 'react'
import OtpInput from '../components/OtpInput'
import { riderApi } from '../services/riderApi'
import type { AssignedOrder } from '../services/riderApi'
import SafeContainer from '../components/SafeContainer'
import { useRiderSession } from '../state/riderSession'

export default function DeliveryInProgressScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const sectionStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 }
  const labelStyle: React.CSSProperties = { fontSize: 13, color: '#6B7280' }
  const btnStyle: React.CSSProperties = { height: 52, borderRadius: 14, border: 'none', background: '#6C2BD9', color: '#fff', fontWeight: 700, width: '100%' }

  const [order, setOrder] = useState<AssignedOrder | null>(null)
  const [otp, setOtp] = useState('')
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
      } catch (e) { console.error('[InProgress] role check/load failed', e) }
    })()
  }, [])

  // If rider somehow lands here while still RIDER_ASSIGNED, route them to assigned screen
  useEffect(() => {
    if (order?.status === 'RIDER_ASSIGNED') {
      window.location.hash = '#/assigned'
    }
  }, [order?.status])

  const deliver = async () => {
    if (!order || !order.orderId) return
    try {
      const clean = (otp || '').trim()
      if (clean.length !== 6) return
      await riderApi.deliverOrder(order.orderId, clean)
      window.location.hash = '#/home'
    } catch (e) {
      console.error('[InProgress] deliver failed', e)
    }
  }

  const start = async () => {
    if (!order || !order.deliveryId) return
    try {
      await riderApi.startDelivery(order.deliveryId)
      // After starting, refresh assigned order to reflect OUT_FOR_DELIVERY and show OTP
      const updated = await riderApi.getAssignedOrder()
      setOrder(updated)
    } catch (e) {
      console.error('[InProgress] start-delivery failed', e)
    }
  }

  return (
    <SafeContainer>
      <div style={titleStyle}>Delivery In Progress</div>
      <div style={cardStyle}>
        <div style={sectionStyle}>
          <div><span style={labelStyle}>Order</span><div>{order?.orderId || '-'}</div></div>
          {order?.status === 'PICKED_UP' && (
            <button type="button" style={btnStyle} onClick={start}>Start Delivery</button>
          )}
          {order?.status === 'OUT_FOR_DELIVERY' && (
            <>
              <OtpInput value={otp} onChange={setOtp} />
              <button
                type="button"
                style={btnStyle}
                disabled={(otp || '').trim().length !== 6}
                onClick={deliver}
              >
                Complete Delivery
              </button>
            </>
          )}
        </div>
      </div>
    </SafeContainer>
  )
}