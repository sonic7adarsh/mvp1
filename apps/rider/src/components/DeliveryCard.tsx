import React from 'react'
import { riderApi } from '../services/riderApi'

export default function DeliveryCard({ deliveryId, orderId, status, storeId }: { deliveryId?: string; orderId: string; status: string; storeId: string }) {
  const cardStyle: React.CSSProperties = { background: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 0 0 1px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 8 }
  const idStyle: React.CSSProperties = { fontSize: 13, color: '#6B7280' }
  const locStyle: React.CSSProperties = { fontSize: 15, color: '#1F1F1F' }
  const btnStyle: React.CSSProperties = { marginTop: 8, height: 52, borderRadius: 14, border: 'none', background: '#6C2BD9', color: '#fff', fontWeight: 700, width: '100%' }

  // Never auto-navigate; UI is driven by backend status and explicit actions.

  return (
    <div style={cardStyle}>
      <div style={idStyle}>Order: {orderId}</div>
      <div style={locStyle}>Store: {storeId}</div>
      <div style={locStyle}>Status: {status}</div>
      {status === 'RIDER_ASSIGNED' && (
        <button
          type="button"
          style={btnStyle}
          onClick={async () => {
            try {
              if (!deliveryId) { console.error('Missing deliveryId', { orderId, status, storeId }); return }
              await riderApi.pickupDelivery(deliveryId)
              // Re-fetch backend truth for active orders
              try { await riderApi.getActiveOrders() } catch {}
            } catch (e) {
              console.error('[DeliveryCard] pickup failed', e)
            }
          }}
        >
          Pick Up Order
        </button>
      )}
      {status === 'PICKED_UP' && (
        <button
          type="button"
          style={btnStyle}
          onClick={async () => {
            try { 
              if (!deliveryId) return
              await riderApi.startDelivery(deliveryId) 
            } catch (e) { console.error('[DeliveryCard] start failed', e) }
            // Optionally navigate to detail for OTP
            window.location.hash = `#/order/${orderId}`
          }}
        >
          Start Delivery
        </button>
      )}
      {status === 'OUT_FOR_DELIVERY' && (
        <button
          type="button"
          style={btnStyle}
          onClick={() => { window.location.hash = `#/order/${orderId}` }}
        >
          Mark Delivered
        </button>
      )}
    </div>
  )
}