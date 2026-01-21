import { useEffect, useState } from 'react'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../api/client'
import { track } from '../utils/track'

export default function Cart() {
  const { items, increment, decrement, subtotal, total, clearCart } = useCart()
  const { jwt } = useAuth()
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || ''
  const [placing, setPlacing] = useState(false)
  const [inventoryError, setInventoryError] = useState('')
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null)
  // Clear inline error when cart items change
  useEffect(() => { setInventoryError('') }, [items])

  // Absolute first render guard: show success overlay before any other UI
  if (successOrderId) {
    const onViewOrder = () => {
      const target = successOrderId ? `#/orders?orderId=${encodeURIComponent(successOrderId)}` : '#/orders'
      window.location.hash = target
    }
    const onHome = () => {
      setSuccessOrderId(null)
      window.location.hash = '#/home'
    }
    return (
      <div style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '360px',
          textAlign: 'center'
        }}>

          <div style={{
            fontSize: '48px',
            color: '#16A34A',
            marginBottom: '16px'
          }}>
            ✓
          </div>

          <div style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#111',
            marginBottom: '8px'
          }}>
            Order placed
          </div>

          <div style={{
            fontSize: '14px',
            color: '#666',
            lineHeight: 1.5,
            marginBottom: '28px'
          }}>
            The store will accept your order shortly<br />
            You’ll be notified when the status changes
          </div>

          <button
            onClick={onViewOrder}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '12px',
              background: '#111827',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 600,
              border: 'none',
              marginBottom: '12px'
            }}
          >
            View order
          </button>

          <button
            onClick={onHome}
            style={{
              width: '100%',
              height: '44px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid #e5e7eb',
              fontSize: '14px',
              color: '#111'
            }}
          >
            Back to home
          </button>

        </div>
      </div>
    )
  }

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    background: '#FFFFFF',
  }

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    background: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    zIndex: 10,
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    paddingBottom: 170, // space for summary + checkout button + footer
    background: '#FFFFFF',
  }

  const itemRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#FAFAFA',
    borderRadius: 12,
    padding: 12,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    marginBottom: 12,
  }

  const qtyControlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }

  const qtyButtonStyle: React.CSSProperties = {
    height: 28,
    padding: '0 12px',
    borderRadius: 8,
    background: '#1AA6A6',
    color: '#FFFFFF',
    border: 'none',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  }

  const summaryStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 56 + 56 + 16, // add 16px spacing below button to avoid edge stickiness
    width: '100%',
    maxWidth: 420,
    background: '#FFFFFF',
    borderTop: '1px solid #E5E7EB',
    boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
    padding: 16,
    zIndex: 20,
  }

  const checkoutButtonStyle: React.CSSProperties = {
    position: 'fixed',
    left: '50%',
    transform: 'translateX(-50%)',
    bottom: 56 + 16, // add 16px spacing from bottom/safe area
    width: 'calc(100% - 24px)',
    maxWidth: 396,
    height: 48,
    borderRadius: 12,
    background: '#1AA6A6',
    color: '#FFFFFF',
    border: 'none',
    fontSize: 16,
    fontWeight: 700,
    zIndex: 30,
    cursor: 'pointer',
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...checkoutButtonStyle,
    background: '#A7E5E5',
    color: '#0A4F4F',
    cursor: 'not-allowed',
    opacity: 0.8,
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>Cart</h1>
      </header>
      {/* Cart main content */}
      <main style={mainStyle}>
        {items.length === 0 ? (
          <div style={{ color: '#6B7280', fontSize: 14 }}>Your cart is empty.</div>
        ) : (
          items.map((item) => (
            <div key={item.productId} style={itemRowStyle}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{item.name || 'Product'}</div>
                <div style={{ fontSize: 12, color: '#666666' }}>
                  {typeof item.price === 'number' ? `₹${item.price} per item` : 'Price shown at store'}
                </div>
              </div>
              <div style={qtyControlsStyle}>
                <button
                  type="button"
                  onClick={() => decrement(item.productId)}
                  style={{ ...qtyButtonStyle, background: '#FFFFFF', color: '#1AA6A6', border: '1px solid #1AA6A6' }}
                >
                  -
                </button>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{item.quantity}</span>
                <button type="button" onClick={() => increment(item.productId)} style={qtyButtonStyle}>+</button>
              </div>
            </div>
          ))
        )}
      </main>
      

      {/* Price Summary (fixed above the checkout button) */}
      {!successOrderId && (
        <div style={summaryStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#6B7280' }}>Subtotal</span>
            <span style={{ fontWeight: 700 }}>{`₹${subtotal}`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#6B7280' }}>Delivery</span>
            <span style={{ fontWeight: 700 }}>₹0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontWeight: 700 }}>{`₹${total}`}</span>
          </div>
        </div>
      )}

      {/* Inline inventory/order failure message above button */}
      {inventoryError ? (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 56 + 56 + 56, width: 'calc(100% - 24px)', maxWidth: 396, color: '#d32f2f', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
          {inventoryError}
        </div>
      ) : null}

      {/* Checkout CTA fixed above footer (hidden when success screen is visible) */}
      {!successOrderId && (
      <button
        type="button"
        style={items.length === 0 || placing ? disabledButtonStyle : checkoutButtonStyle}
        disabled={items.length === 0 || placing}
        onClick={async () => {
          if (items.length === 0 || placing) return
          console.log('[Cart] Place Order clicked')
          console.log('[Cart] Cart items:', items)
          console.log('[PROOF][FE] Cart items before order', items)
          // Clear previous error before a fresh attempt
          setInventoryError('')
          setPlacing(true)
          const ctx = { jwt, tenant }
          try {
            const payloadItems = items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
            const created = await apiFetch<any>(
              '/api/customer/orders',
              { method: 'POST', body: JSON.stringify({ items: payloadItems, paymentMethod: 'COD' }) },
              ctx
            )
            console.log('[Cart] Order created successfully')
            // Clear inline error on success
            setInventoryError('')
            // Save minimal lastOrder for repeat ordering (no price/status)
            try {
              const storeId = String(
                created?.store?.id ?? created?.storeId ?? created?.store_id ?? created?.store?._id ?? ''
              )
              const storeName = String(
                created?.store?.name ?? created?.storeName ?? 'Store'
              )
              const lastOrder = { storeId, storeName, items: payloadItems }
              const active = window.localStorage.getItem('repeatOrderingActive')
              if (active === '1') {
                // Hide block after user places a new repeat order
                try { window.localStorage.removeItem('repeatOrderingActive') } catch {}
                try { window.localStorage.removeItem('lastOrder') } catch {}
              } else {
                window.localStorage.setItem('lastOrder', JSON.stringify(lastOrder))
              }
            } catch {}
            // Show success state first, then clear cart
            try {
              console.log('[Cart] Created order response:', created)
              const id = String((created as any)?.id || '')
              setSuccessOrderId(id)
              try { track('order_placed', { orderId: id, itemsCount: payloadItems.length }) } catch {}
            } catch {
              setSuccessOrderId(null)
            }
            clearCart()
          } catch (e) {
            console.error('[Cart] Place Order failed', e)
            // UI-only inventory/order failure detection
            const status = (e && (e as any).status) as number | undefined
            const code = String((e && (e as any).code) || '')
            const msg = String((e && (e as any).message) || '').toLowerCase()
            const isInventoryFailure =
              status === 409 ||
              code === 'INSUFFICIENT_INVENTORY' ||
              msg.includes('not available')
            if (isInventoryFailure) {
              setInventoryError('Some items are no longer available. Please update your cart.')
            }
          } finally {
            setPlacing(false)
          }
        }}
      >
        Place Order
      </button>
      )}
    </div>
  )
}