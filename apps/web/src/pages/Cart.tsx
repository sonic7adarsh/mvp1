import { useEffect, useState } from 'react'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'
import { useLocation } from '../context/LocationContext'
import { apiFetch } from '../api/client'
import { privateApi, logPrivateAxiosError } from '../api/privateApi'
import { track } from '../utils/track'

export default function Cart() {
  const { items, increment, decrement, subtotal, total, clearCart } = useCart()
  const { jwt } = useAuth()
  const { location } = useLocation()
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || 'tenantA'
  
  const [placing, setPlacing] = useState(false)
  const [inventoryError, setInventoryError] = useState('')
  const [successOrder, setSuccessOrder] = useState<any | null>(null)
  const [showAllItems, setShowAllItems] = useState(false)

  // Clear inline error when cart items change
  useEffect(() => { setInventoryError('') }, [items])

  // Absolute first render guard: show success overlay before any other UI
  if (successOrder) {
    const onViewOrder = () => {
      const orderId = String(successOrder?.id || '')
      const target = orderId ? `#/orders?orderId=${encodeURIComponent(orderId)}` : '#/orders'
      window.location.hash = target
    }
    const onHome = () => {
      setSuccessOrder(null)
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

          {/* Success details from response.order */}
          <div style={{
            textAlign: 'left',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
            color: '#111'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#6B7280' }}>Order ID</span>
              <span style={{ fontWeight: 700 }}>{String(successOrder?.id || '')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
              <span style={{ color: '#6B7280' }}>Status</span>
              <span style={{ fontWeight: 700 }}>{String(successOrder?.status || 'PLACED')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
              <span style={{ color: '#6B7280' }}>Total</span>
              <span style={{ fontWeight: 700 }}>{typeof successOrder?.total === 'number' ? `₹${successOrder.total}` : '—'}</span>
            </div>
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
              marginBottom: '12px',
              cursor: 'pointer'
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
              color: '#111',
              cursor: 'pointer'
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
    background: '#F3F4F6', // Light gray background for contrast
  }

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    background: '#c9f2f6', // User specified Cyan
    borderBottom: '1px solid #A5E0E6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    paddingBottom: 140, // Increased space for footer + safe area
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  }

  const sectionStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  }

  const itemRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottom: '1px solid #F3F4F6',
    paddingBottom: 12,
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
    background: '#111827', // Black
    color: '#FFFFFF',
    border: 'none',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
  }

  const outlineBtnStyle: React.CSSProperties = {
    ...qtyButtonStyle,
    background: '#FFFFFF',
    color: '#111827',
    border: '1px solid #111827',
  }

  const footerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '420px',
    background: '#FFFFFF',
    borderTop: '1px solid #E5E7EB',
    padding: '16px',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom))', // Safe area for iPhone
    zIndex: 30,
    boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
  }

  const placeOrderButtonStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 12,
    background: '#111827', // Black
    color: '#FFFFFF',
    border: 'none',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
  }

  const disabledButtonStyle: React.CSSProperties = {
    ...placeOrderButtonStyle,
    background: '#9CA3AF',
    cursor: 'not-allowed',
  }

  const displayItems = items.slice(0, 2)
  const remainingCount = items.length - 2
  
  // Validate cart has store info
  const isValidCart = items.length > 0 && !!items[0].storeId

  const handlePlaceOrder = async () => {
    if (!isValidCart || placing) return
    
    // Auth Check
    if (!jwt) {
      console.warn('[Cart] User not logged in, redirecting to login')
      // Save current location to return after login
      window.location.hash = '#/login?redirect=/cart'
      return
    }

    console.log('[Cart] Place Order clicked')
    
    // Clear previous error before a fresh attempt
    setInventoryError('')
    setPlacing(true)
    
    try {
      // 1. Prepare payload
      // Backend expects: { items: [], paymentMethod: string, storeId: string, deliveryAddressId: string }
      const storeId = items[0]?.storeId
      if (!storeId) {
        throw new Error('Missing store information in cart')
      }

      // TODO: Get actual delivery address and payment method from UI/State
      // For now, using placeholders as per current UI limitation (address is just 'Home')
      const payload = {
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity
        })),
        paymentMethod: 'cod', // Hardcoded as per UI 'Pay on Delivery'
        storeId,
        deliveryAddressId: 'addr-default' // Placeholder until address management is implemented
      }

      console.log('[Cart] Sending order payload:', payload)

      // 2. Call API
      const response = await privateApi.post('/api/customer/orders', payload)
      const data = response.data

      console.log('[Cart] Order success:', data)
      track('order_placed', { orderId: data.order?.id || data.id, total: data.order?.total || data.total })

      // 3. Success state
      setSuccessOrder(data.order || data)
      clearCart() // Wipe cart context

    } catch (err: any) {
      console.error('[Cart] Order failed:', err)
      logPrivateAxiosError(err, 'place-order')
      
      // Extract error message but keep it user friendly
      let msg = 'Failed to place order. Please try again.'
      
      // Only show specific messages if they are user-actionable (e.g. Out of stock)
      // Otherwise keep it generic to avoid showing raw 404/401/500 errors
      if (err.response?.status === 401) {
          msg = 'Session expired. Please login again.'
      } else if (err.response?.data?.message && !err.response.data.message.includes('Proxy')) {
          msg = err.response.data.message
      }
      
      setInventoryError(msg)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <span
          style={{ fontSize: 18, marginRight: 16, cursor: 'pointer' }}
          onClick={() => window.history.back()}
        >
          ←
        </span>
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>Checkout</h1>
      </header>

      {/* Cart main content */}
      <main className="no-scrollbar" style={mainStyle}>
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 40, color: '#6B7280' }}>
            Your cart is empty
          </div>
        ) : (
          <>
            {/* Items Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Items Added</div>
              {displayItems.map((item) => (
                <div key={item.productId} style={itemRowStyle}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{item.name || 'Product'}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {typeof item.price === 'number' ? `₹${item.price}` : 'Price at store'}
                    </div>
                  </div>
                  <div style={qtyControlsStyle}>
                    <button
                      type="button"
                      onClick={() => decrement(item.productId)}
                      style={outlineBtnStyle}
                    >
                      -
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button type="button" onClick={() => increment(item.productId)} style={qtyButtonStyle}>+</button>
                  </div>
                </div>
              ))}
              
              {remainingCount > 0 && (
                <button 
                  onClick={() => setShowAllItems(true)}
                  style={{ 
                    width: '100%', padding: '10px', background: '#F9FAFB', 
                    border: '1px solid #E5E7EB', borderRadius: 8, 
                    fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer' 
                  }}
                >
                  View {remainingCount} more items
                </button>
              )}
            </div>

            {/* Delivery Address Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Delivery Address</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: '#F3F4F6', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  📍
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Home</div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: '1.4' }}>
                    {location?.label || 'Select your delivery location'}
                  </div>
                </div>
                <button style={{ fontSize: 13, fontWeight: 600, color: '#111827', background: 'none', border: 'none', cursor: 'pointer' }}>
                  CHANGE
                </button>
              </div>
            </div>

            {/* Payment Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Payment Options</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: '#F3F4F6', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  💵
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Pay on Delivery</div>
                  <div style={{ fontSize: 13, color: '#666' }}>Cash / UPI upon delivery</div>
                </div>
              </div>
            </div>

            {/* Bill Details */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>Bill Details</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#4B5563' }}>
                <span>Item Total</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#4B5563' }}>
                <span>Delivery Fee</span>
                <span>₹0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#4B5563' }}>
                <span>Platform Fee</span>
                <span>₹0</span>
              </div>
              <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#111' }}>
                <span>To Pay</span>
                <span>₹{total}</span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer CTA */}
      {!successOrder && (
        <div style={footerStyle}>
          {inventoryError && (
            <div style={{ marginBottom: 12, color: '#EF4444', fontSize: 12, textAlign: 'center', fontWeight: 500 }}>
              {inventoryError}
            </div>
          )}
          
          {!isValidCart && items.length > 0 && (
             <div style={{ marginBottom: 12, color: '#F59E0B', fontSize: 12, textAlign: 'center', fontWeight: 500 }}>
                Cart contains items from an unknown store.
                <button onClick={clearCart} style={{ marginLeft: 8, textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}>
                   Clear Cart
                </button>
             </div>
          )}

          <button
            type="button"
            style={!isValidCart || placing ? disabledButtonStyle : placeOrderButtonStyle}
            disabled={!isValidCart || placing}
            onClick={handlePlaceOrder}
          >
            <span>{placing ? 'Placing Order...' : 'Place Order'}</span>
            {!placing && <span>₹{total}</span>}
          </button>
        </div>
      )}

      {/* View All Items Modal */}
      {showAllItems && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 50,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
          <div style={{
            background: '#FFF',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: '20px 16px',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
            maxHeight: '80dvh', // Use dvh for mobile viewport
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Prevent wrapper scroll, let list scroll
            width: '100%',
            maxWidth: '420px',
            margin: '0 auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>All Items</h3>
              <button 
                onClick={() => setShowAllItems(false)}
                style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {items.map((item) => (
                <div key={item.productId} style={itemRowStyle}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{item.name || 'Product'}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {typeof item.price === 'number' ? `₹${item.price}` : 'Price at store'}
                    </div>
                  </div>
                  <div style={qtyControlsStyle}>
                    <button
                      type="button"
                      onClick={() => decrement(item.productId)}
                      style={outlineBtnStyle}
                    >
                      -
                    </button>
                    <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                    <button type="button" onClick={() => increment(item.productId)} style={qtyButtonStyle}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => setShowAllItems(false)}
              style={{
                width: '100%', padding: '12px', background: '#111827', color: '#FFF',
                border: 'none', borderRadius: 12, fontWeight: 600, marginTop: 16, cursor: 'pointer',
                flexShrink: 0
              }}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
