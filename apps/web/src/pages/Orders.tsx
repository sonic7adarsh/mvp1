import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../api/client'
import { privateApi } from '../api/privateApi'
import { track } from '../utils/track'

// Shared UI helpers for status pill, label, and created time
function pillStyle(status: string): React.CSSProperties {
  const key = String(status || '').toUpperCase()
  const map: Record<string, { bg: string; fg: string }> = {
    PLACED: { bg: '#F3F4F6', fg: '#6B7280' },
    PREPARING: { bg: '#FFF7ED', fg: '#C2410C' },
    DELIVERED: { bg: '#ECFDF5', fg: '#065F46' },
    READY: { bg: '#F0FDF4', fg: '#166534' },
    CANCELLED: { bg: '#FEF2F2', fg: '#991B1B' },
  }
  const colors = map[key] ?? { bg: '#F3F4F6', fg: '#6B7280' }
  return {
    background: colors.bg,
    color: colors.fg,
    borderRadius: 999,
    padding: '4px 8px',
    fontSize: 12,
    fontWeight: 600,
  }
}

function statusLabel(status: string) {
  const s = String(status || '').toUpperCase()
  switch (s) {
    case 'PLACED':
      return 'Placed'
    case 'READY':
      return 'Ready for pickup'
    case 'DELIVERED':
      return 'Delivered'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return String(status || '')
  }
}

function helperLabel(status: string) {
  const s = String(status || '').toUpperCase()
  switch (s) {
    case 'PLACED':
      return 'Waiting for store'
    case 'ACCEPTED':
      return 'Being prepared'
    case 'PREPARING':
      return 'Being prepared'
    case 'READY':
      return 'On the way'
    case 'DELIVERED':
      return 'Delivered'
    case 'CANCELLED':
      return 'Cancelled'
    default:
      return ''
  }
}

function formatCreated(iso?: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  const y = new Date(now)
  y.setDate(now.getDate() - 1)
  if (isSameDay(d, now)) return 'Today'
  if (isSameDay(d, y)) return 'Yesterday'
  const day = d.getDate()
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const mon = months[d.getMonth()] || ''
  return `${day} ${mon}`
}

// C6.2 — Status Consistency Guard (Silent)
const normalizeStatus = (status?: string) => {
  if (!status) return 'PLACED'
  return String(status).toUpperCase()
}

export default function Orders() {
  const { jwt } = useAuth()
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || ''
  // Keep hash in React state so UI re-renders on hash changes
  const [hash, setHash] = useState(
    typeof window !== 'undefined' ? window.location.hash : ''
  )
  useEffect(() => {
    const onHashChange = () => {
      setHash(window.location.hash)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  // Parse orderId from hash state
  const params = new URLSearchParams(hash.split('?')[1] || '')
  const selectedOrderId = params.get('orderId') || ''
  

  

  

  type UIOrder = any

  const [orders, setOrders] = useState<UIOrder[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  // Use orders list as the single source of truth; no separate detail cache

  

  

  const fetchOrders = async () => {
    if (!jwt) return
    const ctx = { jwt, tenant }
    try {
      setLoading(true)
      const data = await privateApi
        .get('/api/customer/orders')
        .then((res) => res.data as any[])
      console.log('[Orders] Orders from backend:', data)
      setOrders(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('[Orders] Fetch failed', e)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  // Initial mount fetch
  useEffect(() => {
    console.log('[Orders] Mount → fetching orders')
    fetchOrders()
  }, [])

  // Do not refetch on hash changes; rely on initial mount fetch unless jwt/tenant changes

  // Do not fetch single order detail; read from already fetched orders list
  // Selected order resolution (robust string compare to avoid type mismatch)
  const selectedOrder = selectedOrderId
    ? orders.find((o: any) => String(o?.id) === String(selectedOrderId))
    : null

  // When hash has orderId but it isn't present in list, attempt detail fetch and show 404 fallback
  const [detailCandidate, setDetailCandidate] = useState<any>(null)
  const [detailNotFound, setDetailNotFound] = useState<boolean>(false)
  const [detailLoading, setDetailLoading] = useState<boolean>(false)

  useEffect(() => {
    if (!selectedOrderId || selectedOrder) {
      // Reset any prior state when navigating back or when list contains the order
      setDetailCandidate(null)
      setDetailNotFound(false)
      setDetailLoading(false)
      return
    }
    // Fetch single order detail to ensure DevTools shows GET /api/customer/orders/{id}
    const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || ''
    setDetailLoading(true)
    privateApi
      .get(`/api/customer/orders/${encodeURIComponent(String(selectedOrderId))}`)
      .then((res) => res.data as any)
      .then((fresh) => {
        if (fresh && typeof fresh === 'object') {
          setDetailCandidate(fresh)
          setDetailNotFound(false)
        } else {
          setDetailCandidate(null)
          setDetailNotFound(true)
        }
      })
      .catch((e: any) => {
        const status = (e && typeof e.status === 'number') ? e.status : 0
        if (status === 404) {
          setDetailCandidate(null)
          setDetailNotFound(true)
        }
        // 401/403 are handled by api client; other errors remain silent
      })
      .finally(() => setDetailLoading(false))
  }, [selectedOrderId, !!selectedOrder])

  // Conditional render (return early with OrderDetail, fallback, or loading)
  if (selectedOrderId && selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={() => {
          window.location.hash = '#/orders'
        }}
      />
    )
  }
  if (selectedOrderId && detailCandidate) {
    return (
      <OrderDetail
        order={detailCandidate}
        onBack={() => {
          window.location.hash = '#/orders'
        }}
      />
    )
  }
  if (selectedOrderId && detailLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: '#FFFFFF' }}>
        <span style={{ fontSize: 14, color: '#777' }}>Loading order…</span>
      </div>
    )
  }
  if (selectedOrderId && detailNotFound) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>Order not found</div>
        <div style={{ fontSize: 13, color: '#777', marginTop: 6 }}>This order may no longer exist or is not accessible.</div>
        <button
          onClick={() => (window.location.hash = '#/orders')}
          style={{ marginTop: 20, height: 44, width: '100%', borderRadius: 10, border: '1px solid #ddd', background: '#fff', fontWeight: 600 }}
        >
          Back to Orders
        </button>
      </div>
    )
  }

  return <OrdersList orders={orders} loading={loading} />
}

function OrdersList({ orders, loading }: { orders: any[]; loading: boolean }) {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    background: '#F8FAFC',
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
    paddingBottom: 72,
  }
  const cardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: 16,
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
    padding: 16,
    marginBottom: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
  }
  const storeStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, marginBottom: 4 }
  const metaStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, color: '#6B7280', fontSize: 12 }
  const helperTextStyle: React.CSSProperties = { fontSize: 12, color: '#777', marginTop: 2 }
  const amountStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700 }
  const rightMetaStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }
  const createdStyle: React.CSSProperties = { fontSize: 12, color: '#6B7280' }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>My Orders</h1>
      </header>
      <main style={mainStyle}>
        {/* Skeletons while loading */}
        {loading && (
          <>
            {[0,1,2].map((i) => (
              <div key={`skeleton-${i}`} style={cardStyle}>
                <div>
                  <div style={{ width: 140, height: 12, background: '#F3F4F6', borderRadius: 6, marginBottom: 6 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 64, height: 12, background: '#F3F4F6', borderRadius: 6 }} />
                    <div style={{ width: 100, height: 20, background: '#F3F4F6', borderRadius: 999 }} />
                  </div>
                </div>
                <div style={rightMetaStyle}>
                  <div style={{ width: 60, height: 12, background: '#F3F4F6', borderRadius: 6 }} />
                  <div style={{ width: 80, height: 14, background: '#F3F4F6', borderRadius: 6 }} />
                </div>
              </div>
            ))}
          </>
        )}
        {/* Empty state after fetch with empty array */}
        {!loading && orders.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <span style={{ fontSize: 14, color: '#777' }}>You haven’t placed any orders yet</span>
          </div>
        ) : (
          orders.map((o: any) => (
            <div
              key={String(o.id)}
              style={cardStyle}
              role="button"
              aria-label={`Order from ${o?.store?.name || ''}`}
              onClick={() => {
                window.location.hash = `#/orders?orderId=${encodeURIComponent(String(o.id))}`
              }}
            >
              <div>
                <div style={storeStyle}>{o?.store?.name || ''}</div>
                <div style={metaStyle}>
                  <span>{`${Array.isArray(o.items) ? o.items.length : 0} items`}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <span style={pillStyle(String(o.status))}>{statusLabel(String(o.status))}</span>
                    {helperLabel(String(o.status)) && (
                      <span style={helperTextStyle}>{helperLabel(String(o.status))}</span>
                    )}
                  </div>
                </div>
              </div>
              <div style={rightMetaStyle}>
                <span style={createdStyle}>{formatCreated(o?.createdAt)}</span>
                <span style={amountStyle}>{`₹${Number(o.total ?? 0)}`}</span>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  )
}

function OrderDetail({ order, onBack }: { order: any; onBack: () => void }) {
  const { jwt } = useAuth()
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    background: '#F8FAFC',
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
    paddingBottom: 72,
  }
  const trackerWrapStyle: React.CSSProperties = { padding: '8px 0 12px 0' }
  const stepRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#111' }
  const helperTextStyle: React.CSSProperties = { fontSize: 13, color: '#777', marginTop: 12, lineHeight: 1.4, textAlign: 'left' }
  const reassuranceStyle: React.CSSProperties = { fontSize: 12, color: '#999', marginTop: 6 }
  const cancelErrorStyle: React.CSSProperties = { fontSize: 13, color: '#d32f2f', marginBottom: 8 }
  const cancelBtnStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 12,
    background: '#FEE2E2',
    color: '#B91C1C',
    fontSize: 16,
    fontWeight: 600,
    border: 'none',
    marginTop: 16,
    cursor: 'pointer',
  }
  const refreshErrorStyle: React.CSSProperties = { fontSize: 13, color: '#d32f2f', marginBottom: 8 }
  const refreshBtnStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    borderRadius: 12,
    background: '#F3F4F6',
    color: '#111',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    marginTop: 12,
    cursor: 'pointer',
  }

  // Local order state for immediate UI updates without refetch
  const [localOrder, setLocalOrder] = useState<any>(order)
  useEffect(() => { setLocalOrder(order) }, [order])
  const updateLocalOrder = (fresh: any) => setLocalOrder((prev: any) => ({ ...prev, ...fresh }))
  const didAutoSync = useRef(false)
  const [canceling, setCanceling] = useState(false)
  const [cancelError, setCancelError] = useState('')
  const [, setRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)

  // One-time auto refresh on detail open (no polling, no loader)
  useEffect(() => {
    if (!order || didAutoSync.current) return
    if (!jwt) {
      // Skip auto refresh if unauthenticated to avoid 401 noise
      return
    }
    didAutoSync.current = true
    const tenantEnv = (import.meta as any).env?.VITE_DEFAULT_TENANT
    const tenant = String(tenantEnv || '')
    const token = jwt
    const ctx = { jwt: token, tenant }
    setIsSyncing(true)
    console.log('[OrderDetail] Auto refresh start', { orderId: String(order.id || ''), tenant, hasToken: Boolean(token) })
    privateApi
      .get(`/api/customer/orders/${encodeURIComponent(String(order.id))}`)
      .then((res) => res.data as any)
      .then((fresh) => {
        if (fresh?.status && fresh.status !== order.status) {
          updateLocalOrder(fresh)
        }
      })
      .catch((e: any) => {
        const status = (e && typeof e.status === 'number') ? e.status : 0
        if (status === 401 || status === 403) {
          console.warn('[OrderDetail] Auto refresh unauthorized', { status })
          return
        }
        // No UI for other errors per requirement
      })
      .finally(() => { setIsSyncing(false); console.log('[OrderDetail] Auto refresh complete') })
    // Runs once per detail open
  }, [order?.id])

  // C6.1 — Invalid / Missing Order Handling (UI-only)
  if (!order) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#111' }}>Order not found</div>
        <div style={{ fontSize: 13, color: '#777', marginTop: 6 }}>This order may no longer exist or is not accessible.</div>
        <button
          onClick={() => (window.location.hash = '#/orders')}
          style={{ marginTop: 20, height: 44, width: '100%', borderRadius: 10, border: '1px solid #ddd', background: '#fff', fontWeight: 600 }}
        >
          Back to Orders
        </button>
      </div>
    )
  }
  const monoStyle: React.CSSProperties = {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: 12,
  }

  const items: any[] = Array.isArray(order?.items) ? order.items : []

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{ fontSize: 18, color: '#6B7280' }}
            role="button"
            onClick={onBack}
          >
            ←
          </span>
          <h1 style={{ fontSize: 16, fontWeight: 700 }}>Order Details</h1>
        </div>
      </header>
      <main style={mainStyle}>
        {/* Progress tracker: text-only, vertical */}
        {(() => {
          const s = normalizeStatus(localOrder?.status)
          const steps = ['Placed', 'Store accepted', 'Out for delivery', 'Delivered']
          let current = 0
          if (s === 'PLACED') current = 0
          else if (s === 'ACCEPTED' || s === 'PREPARING') current = 1
          else if (s === 'READY' || s === 'OUT_FOR_DELIVERY') current = 2
          else if (s === 'DELIVERED') current = 3
          else if (s === 'CANCELLED') current = 0
          return (
            <div style={trackerWrapStyle}>
              {steps.map((label, idx) => {
                const icon = idx < current ? '✓' : idx === current ? '→' : '○'
                const opacity = idx < current ? 1 : idx === current ? 1 : 0.6
                return (
                  <div key={label} style={{ ...stepRowStyle, opacity }}>
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                )
              })}
              {(() => {
                const statusHelperCopy: Record<string, string> = {
                  PLACED: 'Waiting for the store to accept your order',
                  ACCEPTED: 'The store is preparing your order',
                  PREPARING: 'The store is preparing your order',
                  READY: 'Your order is on the way',
                  OUT_FOR_DELIVERY: 'Your order is on the way',
                  DELIVERED: 'Order delivered successfully',
                  CANCELLED: 'This order was cancelled',
                }
                const copy = statusHelperCopy[normalizeStatus(localOrder?.status)] || ''
                return copy ? <div style={helperTextStyle}>{copy}</div> : null
              })()}
              <div style={reassuranceStyle}>You’ll be notified when the order status changes.</div>

              {/* Refresh status button: visible when not DELIVERED or CANCELLED */}
              {(() => {
                const s = normalizeStatus(localOrder?.status)
                const show = s !== 'DELIVERED' && s !== 'CANCELLED'
                if (!show) return null
                return (
                  <div>
                    {refreshError && <div style={refreshErrorStyle}>{refreshError}</div>}
                    <button
                      type="button"
                      style={refreshBtnStyle}
                      disabled={isSyncing}
                      onClick={async () => {
                        if (isSyncing) { console.warn('[OrderDetail] Refresh ignored: isSyncing'); return }
                        console.log('[OrderDetail] Refresh click', { orderId: String(localOrder?.id || '') })
                        setRefreshError('')
                        setRefreshing(true)
                        setIsSyncing(true)
                        try {
                          const tenantEnv = (import.meta as any).env?.VITE_DEFAULT_TENANT
                          const tenant = String(tenantEnv || '')
                          const token = jwt
                          console.log('[OrderDetail] GET /api/customer/orders/:id start', { tenant, hasToken: Boolean(token) })
                          const refreshed = await privateApi
                            .get(`/api/customer/orders/${encodeURIComponent(String(localOrder?.id))}`)
                            .then((res) => res.data as any)
                          console.log('[OrderDetail] GET /api/customer/orders/:id success', { status: String(refreshed?.status || '') })
                          const newStatus = normalizeStatus(refreshed?.status)
                          const oldStatus = normalizeStatus(localOrder?.status)
                          if (newStatus && newStatus !== oldStatus) {
                            setLocalOrder((prev: any) => ({ ...prev, ...refreshed }))
                          }
                        } catch (e: any) {
                          console.error('[OrderDetail] GET /api/customer/orders/:id error', e)
                          const status = (e && typeof e.status === 'number') ? e.status : 0
                          if (status === 404) {
                            setRefreshError('Order not found')
                          } else if (status !== 401 && status !== 403) {
                            console.error('[OrderDetail] refresh error', e)
                            setRefreshError('Failed to refresh')
                          }
                          // 401/403 are handled by api client; still clear local loaders
                        } finally {
                          console.log('[OrderDetail] Refresh complete')
                          setRefreshing(false)
                          setIsSyncing(false)
                        }
                      }}
                    >
                      Refresh status
                    </button>
                  </div>
                )
              })()}

              {/* Cancel button and error: visible only when PLACED */}
              {normalizeStatus(localOrder?.status) === 'PLACED' && (
                <div>
                  {cancelError && <div style={cancelErrorStyle}>{cancelError}</div>}
                  <button
                    type="button"
                    style={cancelBtnStyle}
                    disabled={canceling || isSyncing}
                    onClick={async () => {
                      if (canceling || isSyncing) { console.warn('[OrderDetail] Cancel ignored: busy', { canceling, isSyncing }); return }
                      console.log('[OrderDetail] Cancel click', { orderId: String(localOrder?.id || '') })
                      setCancelError('')
                      setCanceling(true)
                      setIsSyncing(true)
                      try {
                        const tenantEnv = (import.meta as any).env?.VITE_DEFAULT_TENANT
                        const tenant = String(tenantEnv || '')
                        const token = jwt
                        const ctx = { jwt: token, tenant }
                        console.log('[OrderDetail] POST /api/customer/orders/:id/cancel start', { tenant, hasToken: Boolean(token) })
                        await apiFetch<void>(
                          `/api/customer/orders/${encodeURIComponent(String(localOrder?.id))}/cancel`,
                          { method: 'POST', body: JSON.stringify({}) },
                          ctx as any
                        )
                        console.log('[OrderDetail] Cancel success')
                        // Success → update local state to CANCELLED
                        setLocalOrder((prev: any) => ({ ...prev, status: 'CANCELLED' }))
                        try { track('order_cancelled', { orderId: String(localOrder?.id || '') }) } catch {}
                      } catch (e: any) {
                        console.error('[OrderDetail] Cancel error', e)
                        const status = (e && typeof e.status === 'number') ? e.status : 0
                        if (status === 400 || status === 409) {
                          setCancelError('Unable to cancel this order. It may already be accepted.')
                        } else if (status !== 401 && status !== 403) {
                          console.error('[OrderDetail] cancel error', e)
                          setCancelError('Failed to cancel the order')
                        }
                        // 401/403 are handled globally; still clear local loaders
                      } finally {
                        console.log('[OrderDetail] Cancel complete')
                        setCanceling(false)
                        setIsSyncing(false)
                      }
                    }}
                  >
                    {canceling ? 'Cancelling…' : 'Cancel Order'}
                  </button>
                </div>
              )}
            </div>
          )
        })()}
        <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{localOrder?.store?.name || ''}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#6B7280' }}>
            <span style={monoStyle}>{`Order ID: ${String(localOrder?.id)}`}</span>
            <span style={pillStyle(normalizeStatus(localOrder?.status))}>{statusLabel(normalizeStatus(localOrder?.status))}</span>
            <span>{formatCreated(localOrder?.createdAt)}</span>
          </div>
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 6px 16px rgba(0,0,0,0.06)', marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Items</div>
          {items.map((it: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>{String(it.name || '')}</span>
              <span style={{ fontSize: 13, color: '#6B7280' }}>{`× ${Number(it.quantity ?? 0)}`}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#FFFFFF', borderRadius: 16, padding: 16, boxShadow: '0 6px 16px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{`₹${Number(localOrder?.total ?? 0)}`}</span>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#6B7280' }}>Payment: Cash on Delivery</div>
        </div>
      </main>
    </div>
  )
}