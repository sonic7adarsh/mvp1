import { useEffect, useMemo, useRef, useState } from 'react'
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

export default function SellerOrders() {
  const { jwt } = useAuth()
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || ''

  useEffect(() => {
    if (!jwt) {
      window.location.hash = '#/login'
    }
  }, [jwt])

  const [hash, setHash] = useState<string>(typeof window !== 'undefined' ? window.location.hash : '')
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  const params = new URLSearchParams(hash.split('?')[1] || '')
  const selectedOrderId = params.get('orderId') || ''

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
  const listStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
  }

  const [orders, setOrders] = useState<SellerOrder[]>([])
  const [fallbackOrder, setFallbackOrder] = useState<SellerOrder | undefined>(undefined)
  const lastStatusRef = useRef<Record<string, SellerOrder['status']>>({})

  const playPing = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = 880
      osc.connect(gain)
      gain.connect(ctx.destination)
      gain.gain.setValueAtTime(0.0, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.21)
    } catch {}
  }

  useEffect(() => {
    if (!jwt) return
    ;(async () => {
      try {
        const data = await apiFetch<SellerOrder[]>('/api/seller/orders', { method: 'GET' }, { jwt, tenant })
        const arr = Array.isArray(data) ? data : []
        arr.forEach((o) => {
          const prev = lastStatusRef.current[o.id]
          if (prev && prev !== o.status) {
            ;(o as any).__flash = true
            setTimeout(() => { try { delete (o as any).__flash } catch {} }, 3000)
          }
          if (o.status === 'PLACED' && !prev) {
            playPing()
          }
          lastStatusRef.current[o.id] = o.status
        })
        setOrders(arr)
      } catch (e: any) {
        if (e && typeof e === 'object' && 'status' in e && (e.status === 401 || e.status === 403)) {
          try { localStorage.removeItem('seller_token') } catch {}
          window.location.hash = '#/login'
          return
        }
        console.error('[SellerOrders] Fetch error', e)
        setOrders([])
      }
    })()
  }, [jwt, tenant])

  useEffect(() => {
    if (!jwt) return
    if (!selectedOrderId) { setFallbackOrder(undefined); return }
    if (orders && orders.length > 0) { setFallbackOrder(undefined); return }
    ;(async () => {
      try {
        const data = await apiFetch<SellerOrder>(`/api/seller/orders/${encodeURIComponent(selectedOrderId)}`, { method: 'GET' }, { jwt, tenant })
        setFallbackOrder(data)
      } catch (e: any) {
        if (e && typeof e === 'object' && 'status' in e && (e.status === 401 || e.status === 403)) {
          try { localStorage.removeItem('seller_token') } catch {}
          window.location.hash = '#/login'
          return
        }
        console.error('[SellerOrders] Single fetch error', e)
        setFallbackOrder(undefined)
      }
    })()
  }, [selectedOrderId, orders, jwt, tenant])

  const empty = useMemo(() => Array.isArray(orders) && orders.length === 0, [orders])

  const selectedOrder: SellerOrder | undefined = useMemo(() => {
    if (orders && orders.length > 0) {
      return orders.find((o) => o.id === selectedOrderId)
    }
    return fallbackOrder
  }, [orders, selectedOrderId, fallbackOrder])

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

  const pillBase: React.CSSProperties = { borderRadius: 12, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: '#FFFFFF' }
  const pillStyle = (s: SellerOrder['status']): React.CSSProperties => {
    const base = { ...pillBase }
    switch (s) {
      case 'PLACED': return { ...base, background: '#2563EB' }
      case 'ACCEPTED': return { ...base, background: '#7C3AED' }
      case 'READY': return { ...base, background: '#F59E0B' }
      case 'DELIVERED': return { ...base, background: '#10B981' }
      case 'CANCELLED': return { ...base, background: '#EF4444' }
      default: return { ...base, background: '#6B7280' }
    }
  }

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
  const amountStyle: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#111' }
  const timeStyle: React.CSSProperties = { fontSize: 12, color: '#777' }

  const formatCreated = (iso: string) => {
    const d = new Date(iso)
    const dd = d.getDate().toString().padStart(2, '0')
    const mon = d.toLocaleString('en-US', { month: 'short' })
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    return `${dd} ${mon}, ${hh}:${mm}`
  }

  return (
    <div style={pageStyle}>
      <header style={headerStyle}>
        <div style={headerTitleStyle}>Orders</div>
      </header>
      <main style={mainStyle}>
        {empty ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120, color: '#777', fontSize: 14 }}>No orders yet</div>
        ) : (
          <div style={listStyle}>
            {(orders || []).map((o) => {
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

        {selectedOrder && (
          <div style={{ padding: '12px' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Order Detail</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>ID: {selectedOrder.id}</div>
              <div>Status: {statusLabel(selectedOrder.status)}</div>
              <div>Total: ₹{selectedOrder.total}</div>
              <div>Items:
                <ul>
                  {(selectedOrder.items || []).map((it, idx) => (
                    <li key={idx}>{it.name || 'Item'} × {it.quantity || 0}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}