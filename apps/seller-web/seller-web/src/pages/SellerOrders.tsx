import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../AuthContext'
import { useToast } from '../ToastContext'
import { apiFetch } from '../api/client'
import { ClipboardList, ChevronRight, X, Check, ShoppingBag, Clock, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type SellerOrder = {
  id: string
  reference?: string
  status: 'PLACED' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  total: number
  paymentMethod?: string
  customerContact?: { name?: string; phone?: string }
  address?: { fullAddress?: string; line1?: string; city?: string; zip?: string; street?: string; area?: string; pincode?: string }
  items?: Array<{ name?: string; quantity?: number; price?: number; images?: string[] }>
  itemsCount?: number
  // Legacy/Fallback fields
  customer?: { name?: string; phone?: string; address?: any }
  user?: { name?: string; phone?: string; mobile?: string }
  customerName?: string
  customerPhone?: string
  deliveryAddress?: any
}

const REJECTION_REASONS = [
  'Item out of stock',
  'Shop closed',
  'Too busy',
  'Other'
]

export default function SellerOrders() {
  const { t } = useTranslation()
  const { jwt } = useAuth()
  // Tenant deprecated
  
  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<SellerOrder | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  
  // Rejection logic
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectImage, setRejectImage] = useState<string | null>(null)

  // Alarm logic
  const alarmRef = useRef<HTMLAudioElement | null>(null)
  
  useEffect(() => {
    // Check for any PLACED orders
    const hasPlaced = orders.some(o => o.status === 'PLACED')
    
    if (hasPlaced) {
      if (!alarmRef.current) {
        // Simple beep data URI (short beep)
        alarmRef.current = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU')
      }
      
      // Create a simple beep loop
      const playAlarm = () => {
         // Re-create audio context or use simple Audio
         const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
         const osc = ctx.createOscillator()
         const gain = ctx.createGain()
         osc.connect(gain)
         gain.connect(ctx.destination)
         osc.type = 'sine'
         osc.frequency.value = 880 // A5
         gain.gain.value = 0.1
         osc.start()
         setTimeout(() => osc.stop(), 200) // 200ms beep
         setTimeout(() => {
             const osc2 = ctx.createOscillator()
             const gain2 = ctx.createGain()
             osc2.connect(gain2)
             gain2.connect(ctx.destination)
             osc2.type = 'sine'
             osc2.frequency.value = 880
             gain2.gain.value = 0.1
             osc2.start()
             setTimeout(() => osc2.stop(), 200)
         }, 400) // Double beep
      }

      // Interval for repeating alarm
      const interval = setInterval(playAlarm, 3000) // Every 3 seconds
      return () => clearInterval(interval)
    }
  }, [orders])

  useEffect(() => {
    if (jwt) fetchOrders()
  }, [jwt])

  // Handle URL hash for deep linking / routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash
      if (hash.startsWith('#/orders/detail')) {
        const params = new URLSearchParams(hash.split('?')[1])
        const id = params.get('id')
        if (id) {
          // Optimistically show from list if available
          if (orders.length > 0) {
            const found = orders.find(o => o.id === id)
            if (found) setSelectedOrder(found)
          }
          // Always fetch fresh details from separate API
          fetchOrderDetail(id)
        }
      } else if (hash === '#/orders' || hash === '#/orders/') {
        setSelectedOrder(null)
      }
    }
    
    // Check initial
    handleHash()
    
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [orders])

  const openOrder = (order: SellerOrder) => {
    // Update URL to support back button
    window.location.hash = `/orders/detail?id=${order.id}`
    setSelectedOrder(order)
  }

  const closeOrder = () => {
    window.location.hash = '/orders'
    setSelectedOrder(null)
    // Refetch orders to ensure data consistency when returning to list
    fetchOrders()
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await apiFetch<SellerOrder[]>('/api/seller/orders', {}, { jwt })
      if (Array.isArray(res)) {
        console.log('Fetched orders:', res) // Debug log
        // Fallback for missing ID using reference or random
        const safeOrders = res.map(o => {
          if (!o.id) console.warn('Order ID is null for order:', o.reference)
          return {
            ...o,
            id: o.id || o.reference || `temp-${Math.random().toString(36).substr(2, 9)}`,
            status: (o.status || '').toUpperCase() as SellerOrder['status']
          }
        })
        setOrders(safeOrders)
        
        // If we have a selected order, update it with fresh data from list to prevent "corruption"
        if (selectedOrder) {
            const fresh = safeOrders.find(o => o.id === selectedOrder.id)
            if (fresh) {
                // Merge fresh list data but keep detail fields if they are missing in list (list usually has less data)
                // Actually, wait, fetchOrderDetail is authoritative. 
                // But if we go back, we rely on 'orders' state.
                // The issue might be that when we closeOrder, we just nullify selectedOrder.
                // The user says "waps orders page pr jaane see order ka data kyon kharab ho jaa rha hai"
                // This implies the LIST view shows wrong data after returning.
                // This is likely because our Optimistic Update in updateStatus updated 'orders' state with a partial object or wrong structure?
                // In updateStatus we did: setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o))
                // This looks safe... unless 'status' as any is causing issues or we are losing some fields?
                // Ah, wait. If we optimistically update, we might be masking the real state.
                // Let's ensure we re-fetch orders on close or occasionally?
                // Or maybe the 'safeOrders' mapping is inconsistent with optimistic update?
            }
        }
      }
    } catch (e) {
      console.error('Failed to fetch orders', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrderDetail = async (orderId: string) => {
    try {
      setLoadingDetail(true)
      const res = await apiFetch<SellerOrder>(`/api/seller/orders/${orderId}`, {}, { jwt })
      if (res && res.id) {
        // Ensure status is uppercase
        const safeOrder = {
            ...res,
            status: (res.status || '').toUpperCase() as SellerOrder['status']
        }
        setSelectedOrder(safeOrder)
      }
    } catch (e) {
      console.error('Failed to fetch order detail', e)
    } finally {
      setLoadingDetail(false)
    }
  }

  const updateStatus = async (orderId: string, status: string, extraData: any = {}) => {
    // Store previous state for rollback
    const prevOrders = [...orders]
    const prevSelectedOrder = selectedOrder ? { ...selectedOrder } : null

    try {
      let endpoint = ''
      let method = 'POST'
      let body: any = {}

      switch (status) {
        case 'ACCEPTED':
          endpoint = `/api/seller/orders/${orderId}/accept`
          break
        case 'PREPARING':
          endpoint = `/api/seller/orders/${orderId}/prepare`
          break
        case 'READY':
          endpoint = `/api/seller/orders/${orderId}/ready`
          break
        case 'SHIPPED':
          endpoint = `/api/seller/orders/${orderId}/ship`
          break
        case 'DELIVERED':
          endpoint = `/api/seller/orders/${orderId}/deliver`
          break
        case 'CANCELLED':
          endpoint = `/api/seller/orders/${orderId}/cancel`
          body = { reason: extraData.reason }
          break
        case 'REJECTED': // Assuming internal status mapping
          endpoint = `/api/seller/orders/${orderId}/reject`
          body = { reason: extraData.reason }
          break
        default:
          // Fallback or error
          console.warn('Unknown status action', status)
          return
      }

      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null)
      }
      
      // Close modal on final states if desired (only if successful usually, but for optimistic we do it now)
      if (status === 'CANCELLED' || status === 'DELIVERED') {
        setSelectedOrder(null) 
      }
      setShowRejectModal(false)

      await apiFetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
      }, { jwt })
      
    } catch (e) {
      console.error('Failed to update status', e)
      // Rollback on error
      setOrders(prevOrders)
      if (prevSelectedOrder) setSelectedOrder(prevSelectedOrder)
      alert(t('common.error_updating_status', 'Failed to update status'))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // showToast(t('common.file_too_large'), 'error') // Toast not used in this file but context is imported
        alert(t('common.file_too_large')) // Fallback or use toast if available
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setRejectImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Styles
  const headerStyle: React.CSSProperties = {
    padding: '16px',
    background: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid var(--border)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  }

  const titleStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 'var(--radius)',
    padding: 16,
    margin: '0 16px 12px', // Match customer "Stores Near You" spacing
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  }

  const leftColStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  }

  const iconBoxStyle: React.CSSProperties = {
    width: 48, height: 48, borderRadius: 24,
    background: 'var(--bg-color)',
    color: 'var(--text-secondary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }

  const infoStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 2
  }

  const customerNameStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }
  const metaStyle: React.CSSProperties = { fontSize: 13, color: 'var(--text-secondary)' }
  const amountStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }

  const getPillStyle = (status: string): React.CSSProperties => {
    let bg = '#E5E7EB', color = '#374151'
    switch (status) {
      case 'PLACED': bg = 'var(--primary)'; color = '#fff'; break; // Purple for New
      case 'ACCEPTED': bg = '#DBEAFE'; color = '#1E40AF'; break; // Blue
      case 'PREPARING': bg = '#E0F2FE'; color = '#0369A1'; break; // Light Blue
      case 'READY': bg = '#FEF3C7'; color = '#92400E'; break; // Amber
      case 'SHIPPED': bg = '#C7D2FE'; color = '#4338CA'; break; // Indigo
      case 'DELIVERED': bg = '#D1FAE5'; color = '#065F46'; break; // Green
      case 'CANCELLED': bg = '#FEE2E2'; color = '#991B1B'; break; // Red
    }
    return {
      background: bg, color: color,
      padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, textTransform: 'uppercase'
    }
  }

  const SkeletonCard = () => (
    <div style={{...cardStyle, pointerEvents: 'none'}} className="animate-pulse">
      <div style={leftColStyle}>
        <div style={{...iconBoxStyle, background: '#E5E7EB'}}></div>
        <div style={infoStyle}>
          <div style={{height: 16, width: 120, background: '#E5E7EB', borderRadius: 4, marginBottom: 8}}></div>
          <div style={{height: 12, width: 80, background: '#E5E7EB', borderRadius: 4, marginBottom: 8}}></div>
          <div style={{height: 14, width: 60, background: '#E5E7EB', borderRadius: 4}}></div>
        </div>
      </div>
      <div style={{height: 24, width: 80, background: '#E5E7EB', borderRadius: 12}}></div>
    </div>
  )

  const sortedOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return (
    <div style={{ paddingBottom: 80 }}>
      <div style={headerStyle}>
        <h1 style={titleStyle}>{t('orders.title')}</h1>
      </div>

      <div style={{ paddingTop: 12 }}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : sortedOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>{t('orders.no_orders')}</div>
        ) : (
          sortedOrders.map(order => (
            <div key={order.id} style={cardStyle} onClick={() => openOrder(order)}>
              <div style={leftColStyle}>
                <div style={iconBoxStyle}>
                  <ClipboardList size={24} strokeWidth={1.5} />
                </div>
                <div style={infoStyle}>
                  <div style={customerNameStyle}>{order.customerContact?.name || order.customer?.name || order.customerName || order.user?.name || t('orders.guest_customer')}</div>
                  <div style={metaStyle}>#{order.id.slice(-6)} • {order.itemsCount || order.items?.length || 0} {t('orders.items')}</div>
                  <div style={amountStyle}>₹{order.total}</div>
                </div>
              </div>
              <div style={getPillStyle(order.status)}>
                {t(`orders.status.${order.status}`)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Loader for Deep Link */}
      {loadingDetail && !selectedOrder && (
        <div style={{
          position: 'fixed', top: 0, bottom: 0, left: 0, right: 0,
          zIndex: 101, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,255,255,0.5)', backdropFilter: 'blur(2px)'
        }}>
          <div style={{ padding: 16, background: '#fff', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: 600 }}>
            {t('common.loading', 'Loading...')}
          </div>
        </div>
      )}

      {/* Order Detail Page (Full Screen Mobile View) */}
      {selectedOrder && (
        <div style={{
          position: 'fixed', 
          top: 0, 
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '420px', // Match app-container
          background: '#F9FAFB', 
          zIndex: 100,
          display: 'flex', 
          flexDirection: 'column',
          boxShadow: '0 0 20px rgba(0,0,0,0.1)'
        }}>
          
          {/* Header */}
          <div style={{
            height: 56, background: '#fff', borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px'
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>{t('orders.order_details')}</h2>
            <button onClick={closeOrder} style={{ background: 'none', border: 'none', padding: 8 }}>
              <X size={24} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 100 }}>
            
            {/* Status & ID */}
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{t('orders.title')} #{selectedOrder.id.slice(-6)}</span>
                <span style={getPillStyle(selectedOrder.status)}>{t(`orders.status.${selectedOrder.status}`)}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                {new Date(selectedOrder.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Customer Details */}
            {(() => {
               const c = selectedOrder.customer || selectedOrder.user || {}
               const cc = selectedOrder.customerContact || {}
               const addrObj = selectedOrder.address || {}
               const legacyAddr = c.address || selectedOrder.deliveryAddress || selectedOrder.address

               const name = cc.name || c.name || selectedOrder.customerName || t('orders.guest_customer')
               const phone = cc.phone || addrObj.phone || c.phone || c.mobile || selectedOrder.customerPhone || t('orders.no_phone')
               
               // Prioritize structured address from 'address' field (backend prompt)
               const addr = addrObj.fullAddress ? addrObj : legacyAddr
               
               return (
                <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase' }}>{t('orders.customer_details')}</h3>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 20, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} className="text-gray-500" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{name}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{phone}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: 14, lineHeight: 1.5, color: '#374151' }}>
                    {addr ? (
                      typeof addr === 'string' ? addr :
                      (
                        <>
                          {addr.fullAddress && <div>{addr.fullAddress}</div>}
                          {addr.street && <div>{addr.street}</div>}
                          {addr.line1 && <div>{addr.line1}</div>}
                          {addr.area && <div>{addr.area}</div>}
                          {addr.city && <div>{addr.city}</div>}
                          {addr.zip && <div>{addr.zip}</div>}
                          {addr.pincode && <div>{addr.pincode}</div>}
                        </>
                      )
                    ) : <span style={{ color: '#9CA3AF' }}>{t('orders.no_address')}</span>}
                  </div>
                </div>
               )
            })()}

            {/* Items */}
            <div style={{ background: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, boxShadow: 'var(--shadow-sm)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase' }}>{t('orders.items')}</h3>
              {selectedOrder.items?.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 14 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ fontWeight: 600, minWidth: 24 }}>{item.quantity}x</div>
                    <div>{item.name}</div>
                  </div>
                  <div style={{ fontWeight: 600 }}>₹{(item.price || 0) * (item.quantity || 1)}</div>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
                <span>{t('orders.total_bill')}</span>
                <span>₹{selectedOrder.total}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Fixed Bottom) */}
          <div style={{
            background: '#fff', padding: 16, borderTop: '1px solid var(--border)',
            display: 'flex', gap: 12, boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)'
          }}>
              {/* PLACED Status: Reject & Accept */}
              {selectedOrder.status === 'PLACED' && (
                <>
                  <button onClick={() => setShowRejectModal(true)} style={{
                    flex: 1, height: 48, borderRadius: 12, border: '1px solid #EF4444', background: '#fff', color: '#EF4444', fontWeight: 600, fontSize: 16
                  }}>{t('orders.reject')}</button>
                  <button onClick={() => updateStatus(selectedOrder.id, 'ACCEPTED')} style={{
                    flex: 1, height: 48, borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: 16
                  }}>{t('orders.accept')}</button>
                </>
              )}

              {/* Active Order Statuses: Cancel (Secondary) & Next Step (Primary) */}
               {['ACCEPTED', 'PREPARING'].includes(selectedOrder.status) && (
                 <>
                   <button onClick={() => setShowRejectModal(true)} style={{
                      flex: 1, height: 48, borderRadius: 12, border: '1px solid #EF4444', background: '#fff', color: '#EF4444', fontWeight: 600, fontSize: 16
                   }}>{t('orders.cancel_order', 'Cancel Order')}</button>
                   
                   {selectedOrder.status === 'ACCEPTED' && (
                     <button onClick={() => updateStatus(selectedOrder.id, 'PREPARING')} style={{
                         flex: 1, height: 48, borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: 16
                       }}>{t('orders.mark_preparing', 'Mark Preparing')}</button>
                   )}
                   {selectedOrder.status === 'PREPARING' && (
                     <button onClick={() => updateStatus(selectedOrder.id, 'READY')} style={{
                       flex: 1, height: 48, borderRadius: 12, border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, fontSize: 16
                     }}>{t('orders.mark_ready')}</button>
                   )}
                 </>
               )}

               {/* READY: No Cancel allowed, Only Mark Shipped */}
               {selectedOrder.status === 'READY' && (
                 <button onClick={() => updateStatus(selectedOrder.id, 'SHIPPED')} style={{
                   flex: 1, height: 48, borderRadius: 12, border: 'none', background: '#4338CA', color: '#fff', fontWeight: 600, fontSize: 16
                 }}>{t('orders.mark_shipped', 'Mark Shipped')}</button>
               )}

               {/* SHIPPED: No Cancel allowed, Only Mark Delivered */}
               {selectedOrder.status === 'SHIPPED' && (
                 <button onClick={() => updateStatus(selectedOrder.id, 'DELIVERED')} style={{
                   flex: 1, height: 48, borderRadius: 12, border: 'none', background: '#059669', color: '#fff', fontWeight: 600, fontSize: 16
                 }}>{t('orders.mark_delivered')}</button>
               )}
              
              {/* Final States: Close */}
              {['DELIVERED', 'CANCELLED', 'REJECTED'].includes(selectedOrder.status) && (
                <button onClick={closeOrder} style={{
                  flex: 1, height: 48, borderRadius: 12, border: '1px solid var(--border)', background: '#fff', color: 'var(--text-primary)', fontWeight: 600, fontSize: 16
                }}>{t('common.close', 'Close')}</button>
              )}
          </div>
          
          {/* Rejection Modal */}
          {showRejectModal && (
            <div style={{
              position: 'fixed', top: 0, bottom: 0, left: 0, right: 0,
              zIndex: 200, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ background: '#fff', width: '90%', maxWidth: 320, borderRadius: 16, padding: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{t('orders.reject_reason')}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {REJECTION_REASONS.map(r => (
                    <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
                      <input 
                        type="radio" 
                        name="rejectReason" 
                        checked={rejectReason === r}
                        onChange={() => setRejectReason(r)}
                      />
                      <span>{t(`orders.rejection_reasons.${r.toLowerCase().replace(/ /g, '_')}`, r)}</span>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowRejectModal(false)} style={{ flex: 1, height: 44, border: '1px solid var(--border)', background: '#fff', borderRadius: 8 }}>{t('common.cancel')}</button>
                  <button 
                    disabled={!rejectReason}
                    onClick={() => {
                        const statusToSet = selectedOrder.status === 'PLACED' ? 'REJECTED' : 'CANCELLED'
                        updateStatus(selectedOrder.id, statusToSet, { reason: rejectReason })
                    }}
                    style={{ flex: 1, height: 44, background: '#EF4444', color: '#fff', borderRadius: 8, border: 'none', opacity: rejectReason ? 1 : 0.5 }}
                  >
                    {selectedOrder.status === 'PLACED' ? t('orders.confirm_reject') : t('orders.confirm_cancel', 'Confirm Cancel')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
