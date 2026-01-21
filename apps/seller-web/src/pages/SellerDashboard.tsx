import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../api/client'

type SellerOrder = {
  id: string
  status: 'PLACED' | 'ACCEPTED' | 'READY' | 'DELIVERED' | 'CANCELLED'
  createdAt: string
  total: number
  customer?: { name?: string }
  items?: Array<{ name?: string; quantity?: number }>
}

export default function SellerDashboard() {
  const { jwt } = useAuth()
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || ''

  useEffect(() => {
    if (!jwt) {
      window.location.hash = '#/login'
    }
  }, [jwt])

  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    background: '#FFFFFF',
  }
  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    background: '#FFFFFF',
    borderBottom: '1px solid #eee',
    zIndex: 20,
  }
  const headerTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: '#111',
  }
  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
  }

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    gap: 8,
    padding: '12px 12px 0 12px',
  }
  const statBlockStyle: React.CSSProperties = {
    flex: 1,
    padding: 12,
    textAlign: 'center',
  }
  const statCountStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: '#111',
  }
  const statLabelStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  }

  const ctaWrapStyle: React.CSSProperties = { padding: '12px' }
  const ctaButtonStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: 'none',
    background: '#111827',
    color: '#fff',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
  }

  const sectionTitleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#111', padding: '8px 12px', marginTop: 8 }
  const listStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column' }
  const rowStyle: React.CSSProperties = {
    padding: '14px 16px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    cursor: 'pointer',
  }
  const leftColStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }
  const idTextStyle: React.CSSProperties = { fontSize: 13, color: '#555' }
  const nameTextStyle: React.CSSProperties = { fontSize: 15, fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
  const itemsTextStyle: React.CSSProperties = { fontSize: 13, color: '#777' }
  const rightColStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }
  const pillBase: React.CSSProperties = { borderRadius: 12, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#FFFFFF' }
  const amountStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#111' }
  const timeStyle: React.CSSProperties = { fontSize: 12, color: '#777' }

  const [orders, setOrders] = useState<SellerOrder[]>([])

  const shortenId = (id: string) => {
    const s = String(id || '')
    const last6 = s.length > 6 ? s.slice(-6) : s
    return `#${last6}`
  }
  const statusLabel = (s: SellerOrder['status']) => {
    switch (s) {
      case 'PLACED':
        return 'New'
      case 'ACCEPTED':
        return 'Accepted'
      case 'READY':
        return 'Ready'
      case 'DELIVERED':
        return 'Delivered'
      case 'CANCELLED':
        return 'Cancelled'
      default:
        return String(s)
    }
  }
  const pillStyle = (s: SellerOrder['status']): React.CSSProperties => {
    const base = { ...pillBase }
    switch (s) {
      case 'PLACED':
        return { ...base, background: '#2563EB' }
      case 'ACCEPTED':
        return { ...base, background: '#7C3AED' }
      case 'READY':
        return { ...base, background: '#F59E0B' }
      case 'DELIVERED':
        return { ...base, background: '#10B981' }
      case 'CANCELLED':
        return { ...base, background: '#EF4444' }
      default:
        return { ...base, background: '#6B7280' }
    }
  }
  const formatCreated = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const isToday = d.toDateString() === now.toDateString()
    const y = new Date(now)
    y.setDate(now.getDate() - 1)
    const isYesterday = d.toDateString() === y.toDateString()
    if (isToday) return 'Today'
    if (isYesterday) return 'Yesterday'
    const dd = d.getDate().toString().padStart(2, '0')
    const mon = d.toLocaleString('en-US', { month: 'short' })
    return `${dd} ${mon}`
  }

  useEffect(() => {
    if (!jwt) return
    ;(async () => {
      try {
        const data = await apiFetch<SellerOrder[]>('/api/seller/orders', { method: 'GET' }, { jwt, tenant })
        setOrders(Array.isArray(data) ? data : [])
      } catch (e: any) {
        if (e && typeof e === 'object' && 'status' in e && (e.status === 401 || e.status === 403)) {
          try { localStorage.removeItem('seller_token') } catch {}
          window.location.hash = '#/login'
          return
        }
        console.error('[SellerDashboard] Fetch error', e)
        setOrders([])
      }
    })()
  }, [jwt, tenant])

  const todayCount = useMemo(() => {
    const now = new Date()
    return orders.filter(o => {
      const d = new Date(o.createdAt)
      return d.toDateString() === now.toDateString()
    }).length
  }, [orders])

  const pendingCount = useMemo(() => orders.filter(o => o.status === 'PLACED').length, [orders])
  const inProgressCount = useMemo(() => orders.filter(o => o.status === 'ACCEPTED' || o.status === 'READY').length, [orders])

  const latestThree = useMemo(() => {
    const arr = Array.isArray(orders) ? [...orders] : []
    arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return arr.slice(0, 3)
  }, [orders])

  const empty = useMemo(() => Array.isArray(orders) && orders.length === 0, [orders])

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerTitleStyle}>Dashboard</div>
      </header>
      <main style={mainStyle}>
        <div style={statsRowStyle}>
          <div style={statBlockStyle}>
            <div style={statCountStyle}>{todayCount}</div>
            <div style={statLabelStyle}>Today’s Orders</div>
          </div>
          <div style={statBlockStyle}>
            <div style={statCountStyle}>{pendingCount}</div>
            <div style={statLabelStyle}>Pending</div>
          </div>
          <div style={statBlockStyle}>
            <div style={statCountStyle}>{inProgressCount}</div>
            <div style={statLabelStyle}>In Progress</div>
          </div>
        </div>

        <div style={ctaWrapStyle}>
          <button type="button" style={ctaButtonStyle} onClick={() => { window.location.hash = '#/orders' }}>
            View Orders
          </button>
        </div>

        <div style={sectionTitleStyle}>Recent Orders</div>
        {empty ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#777', fontSize: 14 }}>No orders yet</div>
        ) : (
          <div style={listStyle}>
            {latestThree.map((o) => {
              const itemCount = Array.isArray(o.items) ? o.items.reduce((n, it) => n + (Number(it.quantity || 0) || 0), 0) : 0
              return (
                <div
                  key={o.id}
                  style={rowStyle}
                  onClick={() => {
                    if (!o.id) return
                    window.location.hash = `#/orders?orderId=${encodeURIComponent(o.id)}`
                  }}
                >
                  <div style={leftColStyle}>
                    <div style={idTextStyle}>{shortenId(o.id)}</div>
                    <div style={nameTextStyle}>{o.customer?.name || 'Customer'}</div>
                    <div style={itemsTextStyle}>{itemCount} items</div>
                  </div>
                  <div style={rightColStyle}>
                    <div style={pillStyle(o.status)}>{statusLabel(o.status)}</div>
                    <div style={amountStyle}>₹{o.total}</div>
                    <div style={timeStyle}>{formatCreated(o.createdAt)}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}