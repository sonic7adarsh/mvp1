import { useEffect, useState } from 'react'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'
import { useLocation } from '../context/LocationContext'
import { apiFetch } from '../api/client'
import { privateApi, logPrivateAxiosError } from '../api/privateApi'
import { track } from '../utils/track'
import { loadRazorpay } from '../utils/loadRazorpay'
import { initiatePayment, verifyPayment, getUserAddresses, checkout, getUserProfile } from '../api/endpoints'

import { CategoryGrid } from '../components/CategoryGrid'
import { useTranslation } from 'react-i18next'
import { MapPin, ChevronRight, Plus, X, Check } from 'lucide-react'

export default function Cart() {
  const { t } = useTranslation()
  const { items, increment, decrement, subtotal, total, clearCart } = useCart()
  const { jwt } = useAuth()
  const { location } = useLocation()
  
  const [placing, setPlacing] = useState(false)
  const [inventoryError, setInventoryError] = useState('')
  const [successOrder, setSuccessOrder] = useState<any | null>(null)
  const [showAllItems, setShowAllItems] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi'>('cod')
  
  // Address State
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [showAddressSelector, setShowAddressSelector] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Load saved addresses and profile
  useEffect(() => {
    if (jwt) {
      loadAddresses()
      getUserProfile().then(setUserProfile).catch(err => console.error('Failed to load profile', err))
    }
  }, [jwt])

  const loadAddresses = async () => {
    try {
      const data = await getUserAddresses()
      setAddresses(data)
      if (data.length > 0 && !selectedAddressId) {
        // Find default or first
        const def = data.find((a: any) => a.isDefault) || data[0]
        setSelectedAddressId(def.id)
      }
    } catch (err) {
      console.error('Failed to load addresses', err)
    }
  }

  // Categories for empty state suggestions
  const categories = [
      'grocery', 'fresh', 'dairy', 'snacks', 'beauty', 
      'household', 'baby', 'electronics', 'pharmacy'
  ]

  const handleCategorySelect = (cat: string) => {
     // Navigate to Home with category filter
     window.location.hash = `#/home?category=${cat}`
  }

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
            {t('cart.order_placed')}
          </div>

          <div style={{
            fontSize: '14px',
            color: '#666',
            lineHeight: 1.5,
            marginBottom: '28px'
          }}>
            {t('cart.order_pending')}
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
              <span style={{ color: '#6B7280' }}>{t('cart.order_id')}</span>
              <span style={{ fontWeight: 700 }}>{String(successOrder?.id || '')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
              <span style={{ color: '#6B7280' }}>{t('cart.status')}</span>
              <span style={{ fontWeight: 700 }}>{String(successOrder?.status || 'PLACED')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 6 }}>
              <span style={{ color: '#6B7280' }}>{t('cart.total')}</span>
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
            {t('cart.view_order')}
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
            {t('cart.back_to_home')}
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

  const handleOnlinePayment = async () => {
    if (!jwt) {
      window.location.hash = '#/login?redirect=/cart'
      return
    }

    setPlacing(true)
    setInventoryError('')

    try {
      const isLoaded = await loadRazorpay()
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.')
      }

      // Initiate Payment
      const ctx = { jwt }
      const orderData = await initiatePayment(total, 'INR', 'upi', ctx)

      const options = {
        key: (import.meta as any).env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Bharat App",
        description: "Order Payment",
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await verifyPayment(response, ctx)
            if (verifyRes && (verifyRes.success || verifyRes.status === 'PAID' || verifyRes.order)) {
              const order = verifyRes.order || verifyRes
              setSuccessOrder(order)
              clearCart()
              track('order_placed', { orderId: order.id, total: total, method: 'upi' })
            } else {
              setInventoryError('Payment verification failed')
            }
          } catch (e: any) {
            console.error(e)
            setInventoryError(e.message || 'Payment verification failed')
          }
        },
        prefill: {
          contact: '', // User will enter
          email: ''    // User will enter
        },
        theme: {
          color: "#111827"
        },
        modal: {
          ondismiss: function() {
            setPlacing(false)
          }
        }
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.on('payment.failed', function (response: any) {
        setInventoryError(response.error.description || 'Payment failed')
        setPlacing(false)
      })
      rzp.open()

    } catch (err: any) {
      console.error(err)
      setInventoryError(err.message || 'Failed to initiate payment')
      setPlacing(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!isValidCart || placing) return
    
    // Auth Check
    if (!jwt) {
      console.warn('[Cart] User not logged in, redirecting to login')
      // Save current location to return after login
      window.location.hash = '#/login?redirect=/cart'
      return
    }

    if (paymentMethod === 'upi') {
      handleOnlinePayment()
      return
    }

    console.log('[Cart] Place Order clicked')
    
    // Clear previous error before a fresh attempt
    setInventoryError('')
    setPlacing(true)
    
    try {
      // 1. Prepare payload
      // Backend expects: { items: [], paymentMethod: string, storeId: string, addressId: string, notes?: string }
      const storeId = items[0]?.storeId
      if (!storeId) {
        throw new Error('Missing store information in cart')
      }

      // Resolve Address
      let finalAddressId = ''
      
      if (addresses.length > 0) {
          if (!selectedAddressId) {
              setPlacing(false)
              alert('Please select a delivery address')
              return
          }
          finalAddressId = selectedAddressId
      } else {
         // Fallback logic if needed, but per requirements we should enforce address selection
         setPlacing(false)
         alert('Please add a delivery address in your profile first')
         return
      }

      // Get full address object
      const finalAddressObject = addresses.find(a => a.id === finalAddressId)

      const payload = {
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity
        })),
        paymentMethod: 'cod', // Hardcoded as per UI 'Pay on Delivery'
        storeId,
        addressId: finalAddressId,
        // Proactively send details to help backend
        deliveryAddress: finalAddressObject, 
        customerName: userProfile?.name,
        customerPhone: userProfile?.phone,
        customer: userProfile ? {
            name: userProfile.name,
            phone: userProfile.phone,
            address: finalAddressObject
        } : undefined,
        notes: '' // Optional
      }

      console.log('[Cart] Sending order payload:', payload)

      // 2. Call API
      const ctx = { jwt }
      const data = await checkout(payload, ctx)

      console.log('[Cart] Order success:', data)
      track('order_placed', { orderId: data.order?.id || data.id, total: data.order?.total || data.total })

      // 3. Success state
      setSuccessOrder(data.order || data)
      clearCart() // Wipe cart context

    } catch (err: any) {
      console.error('[Cart] Order failed:', err)
      logPrivateAxiosError(err, 'place-order')
      
      // AUTO-REDIRECT IF SESSION EXPIRED (401/403)
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.warn('[Cart] Session expired during order placement. Redirecting to login...')
          window.location.hash = '#/login?redirect=/cart'
          return
      }

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
        <h1 style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>{t('cart.title')}</h1>
      </header>

      {/* Cart main content */}
      <main className="no-scrollbar" style={mainStyle}>
        {items.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            paddingTop: 40,
            paddingBottom: 40
          }}>
            <div style={{ fontSize: '64px', marginBottom: 16 }}>🛍️</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0, marginBottom: 8 }}>
              {t('cart.empty_title')}
            </h2>
            <p style={{ fontSize: 14, color: '#6B7280', margin: 0, marginBottom: 32, textAlign: 'center', maxWidth: 260 }}>
              {t('cart.empty_desc')}
            </p>

            <button
              onClick={() => window.location.hash = '#/home'}
              style={{
                background: '#111827',
                color: '#FFF',
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: 48,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              {t('cart.start_shopping')}
            </button>

            <div style={{ width: '100%', textAlign: 'left' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111', paddingLeft: 16, marginBottom: 16 }}>
                {t('cart.explore_categories')}
              </h3>
              <CategoryGrid 
                categories={categories}
                selectedCategory=""
                onSelectCategory={handleCategorySelect}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Items Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>{t('cart.items_added')}</div>
              {displayItems.map((item) => (
                <div key={item.productId} style={itemRowStyle}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{item.name || 'Product'}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {typeof item.price === 'number' ? `₹${item.price}` : t('cart.price_at_store')}
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
                  {t('cart.view_more_items', { count: remainingCount })}
                </button>
              )}
            </div>

            {/* Delivery Address Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>{t('cart.delivery_address')}</div>
              
              {addresses.length > 0 ? (
                 <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: '#F3F4F6', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MapPin size={20} className="text-gray-700" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                        {addresses.find(a => a.id === selectedAddressId)?.name || 'Selected Address'}
                      </div>
                      <div style={{ fontSize: 13, color: '#666', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {(() => {
                          const addr = addresses.find(a => a.id === selectedAddressId)
                          return addr ? `${addr.line1}, ${addr.city}, ${addr.zip}` : 'Select an address'
                        })()}
                      </div>
                    </div>
                    <button 
                        onClick={() => setShowAddressSelector(true)}
                        style={{ fontSize: 13, fontWeight: 600, color: '#111827', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Change
                    </button>
                 </div>
              ) : (
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 13, color: '#666' }}>No saved addresses</div>
                    <button 
                        onClick={() => window.location.hash = '#/profile'}
                        style={{ fontSize: 13, fontWeight: 600, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        + Add Address
                    </button>
                 </div>
              )}
            </div>

            {/* Payment Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>{t('cart.payment_options')}</div>
              
              {/* COD Option */}
              <div 
                onClick={() => setPaymentMethod('cod')}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  marginBottom: 12,
                  cursor: 'pointer',
                  padding: 8,
                  borderRadius: 8,
                  border: paymentMethod === 'cod' ? '2px solid #111827' : '1px solid #E5E7EB',
                  background: paymentMethod === 'cod' ? '#F9FAFB' : '#FFFFFF'
                }}
              >
                <div style={{ width: 40, height: 40, background: '#F3F4F6', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  💵
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{t('cart.pay_on_delivery')}</div>
                  <div style={{ fontSize: 13, color: '#666' }}>{t('cart.pay_on_delivery_desc')}</div>
                </div>
                {paymentMethod === 'cod' && <div style={{ marginLeft: 'auto', color: '#111827', fontWeight: 'bold' }}>✓</div>}
              </div>

              {/* UPI Option - DISABLED */}
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  cursor: 'not-allowed',
                  padding: 8,
                  borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  background: '#F9FAFB',
                  opacity: 0.6
                }}
              >
                <div style={{ width: 40, height: 40, background: '#F3F4F6', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  📱
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#6B7280' }}>UPI / Online <span style={{ fontSize: 10, background: '#E5E7EB', padding: '2px 6px', borderRadius: 4, marginLeft: 6 }}>COMING SOON</span></div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>Pay via UPI, Cards, Netbanking</div>
                </div>
              </div>
            </div>

            {/* Bill Details */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>{t('cart.bill_details')}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#4B5563' }}>
                <span>{t('cart.item_total')}</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#4B5563' }}>
                <span>{t('cart.delivery_fee')}</span>
                <span>₹0</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#4B5563' }}>
                <span>{t('cart.platform_fee')}</span>
                <span>₹0</span>
              </div>
              <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#111' }}>
                <span>{t('cart.to_pay')}</span>
                <span>₹{total}</span>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer CTA */}
      {!successOrder && items.length > 0 && (
        <div style={footerStyle}>
          {inventoryError && (
            <div style={{ marginBottom: 12, color: '#EF4444', fontSize: 12, textAlign: 'center', fontWeight: 500 }}>
              {inventoryError}
            </div>
          )}
          
          {!isValidCart && items.length > 0 && (
             <div style={{ marginBottom: 12, color: '#F59E0B', fontSize: 12, textAlign: 'center', fontWeight: 500 }}>
                {t('cart.unknown_store_error')}
                <button onClick={clearCart} style={{ marginLeft: 8, textDecoration: 'underline', border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}>
                   {t('cart.clear_cart')}
                </button>
             </div>
          )}

          <button
            type="button"
            style={!isValidCart || placing ? disabledButtonStyle : placeOrderButtonStyle}
            disabled={!isValidCart || placing}
            onClick={handlePlaceOrder}
          >
            <span>
              {placing ? t('cart.placing_order') : t('cart.place_order')}
            </span>
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
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{t('cart.all_items')}</h3>
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
                      {typeof item.price === 'number' ? `₹${item.price}` : t('cart.price_at_store')}
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
              {t('cart.done')}
            </button>
          </div>
        </div>
      )}
      {/* Address Selector Modal */}
      {showAddressSelector && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 60,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end'
        }}>
          <div style={{
            background: '#FFF',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            padding: '20px 16px',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
            maxHeight: '70dvh',
            display: 'flex', flexDirection: 'column',
            width: '100%', maxWidth: '420px', margin: '0 auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Select Address</h3>
              <X onClick={() => setShowAddressSelector(false)} style={{ cursor: 'pointer' }} />
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {addresses.map(addr => (
                    <div 
                        key={addr.id}
                        onClick={() => {
                            setSelectedAddressId(addr.id)
                            setShowAddressSelector(false)
                        }}
                        style={{
                            padding: 12,
                            borderRadius: 12,
                            border: selectedAddressId === addr.id ? '2px solid #111827' : '1px solid #E5E7EB',
                            background: selectedAddressId === addr.id ? '#F9FAFB' : '#FFF',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 12
                        }}
                    >
                        <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{addr.name}</div>
                              <div style={{ fontSize: 13, color: '#4B5563', lineHeight: 1.4 }}>
                                {addr.line1}, {addr.city}, {addr.zip}
                              </div>
                          </div>
                        {selectedAddressId === addr.id && <Check size={18} color="#111827" />}
                    </div>
                ))}
            </div>
            
            <button 
                onClick={() => window.location.hash = '#/profile'}
                style={{
                    marginTop: 16, width: '100%', padding: '12px',
                    background: '#F3F4F6', color: '#111827',
                    border: 'none', borderRadius: 12, fontWeight: 600,
                    cursor: 'pointer'
                }}
            >
                + Add New Address
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
