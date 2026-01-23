import React, { useEffect, useState } from 'react'
import AvailabilityToggle from '../components/AvailabilityToggle'
import { riderApi } from '../services/riderApi'
import SafeContainer from '../components/SafeContainer'
import { useRiderSession } from '../state/riderSession'

export default function HomeScreen() {
  const titleStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#1F1F1F', marginBottom: 12 }
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: '16px', boxShadow: '0 0 0 1px rgba(0,0,0,0.04)' }
  const sectionTitleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#1F1F1F', margin: '16px 0 8px' }

  const [availableOrders, setAvailableOrders] = useState<any[]>([])
  const [canUseRider, setCanUseRider] = useState<boolean>(false)
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
        setCanUseRider(true)
        const resp = await riderApi.getAvailableOrders()
        setAvailableOrders((resp && (resp as any).orders) || [])
      } catch (e) {
        console.error('[Home] role check or load failed', e)
      }
    })()
  }, [])

  return (
    <SafeContainer>
      <div style={titleStyle}>Rider Home</div>
      <div style={cardStyle}>
        {canUseRider ? <AvailabilityToggle /> : <div style={{ color: '#6B7280', fontSize: 14 }}>Complete onboarding to enable availability</div>}
      </div>
      <div style={sectionTitleStyle}>Available Orders</div>
      {availableOrders.length === 0 && (
        <div style={cardStyle}>
          <div style={{ color: '#6B7280', fontSize: 14 }}>No available orders</div>
        </div>
      )}
      {availableOrders.length > 0 && (
        <div>
          {availableOrders.map((o: any) => (
            <div key={o.orderId || o.id} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1F1F1F' }}>Order #{o.orderId || o.id}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{o.storeName || o.storeId || 'Store'}</div>
              </div>
              <button
                style={{ height: 44, borderRadius: 12, border: 'none', background: '#16A34A', color: '#fff', fontWeight: 700 }}
                onClick={async () => {
                  const id = String(o.orderId || o.id)
                  try {
                    await riderApi.acceptOrder(id)
                    // After success, redirect to My Orders
                    window.location.hash = '#/my-orders'
                  } catch (e: any) {
                    if (e && typeof e === 'object' && 'status' in e && e.status === 409) {
                      alert('Order already taken')
                    } else {
                      console.error('Accept failed', e)
                    }
                  }
                }}
              >
                Accept Order
              </button>
            </div>
          ))}
        </div>
      )}
    </SafeContainer>
  )
}