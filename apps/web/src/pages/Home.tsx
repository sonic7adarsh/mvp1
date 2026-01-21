import { useEffect, useState } from 'react'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'
import { getServiceability, getCategories, getStorefrontStores } from '../api/endpoints'
import { track } from '../utils/track'

export default function Home() {
  const { jwt } = useAuth()
  const { prefillCart } = useCart()
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || ''
  // Page acts as a flex column; header sits above the scrollable main area.
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  }

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
    background: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    paddingTop: '12px',
    paddingBottom: '72px', // avoid footer overlap
  }

  const locationStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
  }

  const locationTitleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
  }

  const locationSubStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B7280',
  }

  const avatarStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: '#E5E7EB',
  }

  const searchSectionStyle: React.CSSProperties = {
    margin: '12px 16px 16px',
  }

  const searchInputStyle: React.CSSProperties = {
    height: '44px',
    width: '100%',
    borderRadius: '999px',
    background: '#F3F4F6',
    border: 'none',
    padding: '0 14px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    padding: '0 16px 8px',
    marginTop: '20px',
  }

  const categoryWrapStyle: React.CSSProperties = {
    padding: '0 16px',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  }

  const categoryCardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
  }

  const categoryIconStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
    borderRadius: '20px',
    background: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    marginBottom: '8px',
  }

  const categoryLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    textAlign: 'center',
  }

  const storeCardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
    padding: '16px',
    margin: '0 16px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }

  const storeMetaStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  const storeNameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
  }

  const storeDistanceStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B7280',
  }

  const etaBadgeStyle: React.CSSProperties = {
    background: '#00B761',
    color: '#FFFFFF',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 600,
  }

  const [categories, setCategories] = useState<Array<{ id: string; label: string; icon?: string }>>([])
  const [stores, setStores] = useState<Array<{ id: string; name: string; distance?: string; eta?: string }>>([])
  const [storesLoading, setStoresLoading] = useState<boolean>(false)
  const [lastOrder, setLastOrder] = useState<
    | { storeId: string; storeName: string; items: Array<{ productId: string; quantity: number }> }
    | null
  >(null)

  useEffect(() => {
    // Require JWT for backend-driven Home; if missing, redirect to login
    if (!jwt) {
      window.location.hash = '/login'
      return
    }
    // Track home view once authenticated
    track('home_viewed', {})
    // Read lastOrder from localStorage; hide if malformed or empty
    try {
      const raw = window.localStorage.getItem('lastOrder')
      if (raw) {
        const parsed = JSON.parse(raw)
        const storeId = String(parsed?.storeId || '')
        const storeName = String(parsed?.storeName || 'Store')
        const items = Array.isArray(parsed?.items) ? parsed.items : []
        if (storeId && items.length > 0) {
          setLastOrder({ storeId, storeName, items: items.map((i: any) => ({ productId: String(i.productId), quantity: Number(i.quantity || 0) || 0 })) })
        } else {
          setLastOrder(null)
        }
      } else {
        setLastOrder(null)
      }
    } catch {
      setLastOrder(null)
    }
    const ctx = { jwt, tenant }
    ;(async () => {
      // Always attempt storefront stores per MVP proof, regardless of other calls
      try {
        setStoresLoading(true)
        const near = await getStorefrontStores(ctx)
        setStores(
          (near || []).map((s: any) => ({
            id: String(s.id ?? s._id ?? s.slug ?? s.name ?? 'unknown'),
            name: s.name || 'Store',
            distance: s.distance ? `${s.distance} km` : undefined,
            eta: s.eta ? `${s.eta} mins` : undefined,
          }))
        )
      } catch (e) {
        console.warn('Stores fetch failed', e)
        setStores([])
      } finally {
        setStoresLoading(false)
      }

      // Best-effort: serviceability and categories, but do not block stores
      try {
        // Build required serviceability query: storeId, lat, lng, optional tenantId
        const defaultStoreId = (import.meta as any).env?.VITE_DEFAULT_STORE_ID || ''
        // Prefer env defaults for coordinates; skip if missing
        const defaultLat = (import.meta as any).env?.VITE_DEFAULT_LAT
        const defaultLng = (import.meta as any).env?.VITE_DEFAULT_LNG

        // Derive a storeId to check: env default or first store from API
        const firstStore = Array.isArray(stores) && stores.length > 0 ? stores[0] : undefined
        const svcStoreId = String(defaultStoreId || firstStore?.id || '')

        if (svcStoreId && defaultLat && defaultLng) {
          const svc = await getServiceability(
            {
              storeId: svcStoreId,
              lat: Number(defaultLat),
              lng: Number(defaultLng),
              tenantId: tenant || undefined,
            },
            ctx
          )
          if (svc && svc.serviceable === false) {
            setCategories([])
            return
          }
        } else {
          console.warn('Serviceability skipped: missing storeId or VITE_DEFAULT_LAT/LNG')
        }
      } catch {}

      try {
        const cats = await getCategories(ctx)
        setCategories(
          (cats || []).map((c: any) => {
            if (typeof c === 'string') {
              return { id: c, label: c, icon: '🛒' }
            }
            const id = String(c.id ?? c._id ?? c.slug ?? c.name ?? c.label ?? 'unknown')
            const label = c.name || c.label || 'Category'
            return { id, label, icon: '🛒' }
          })
        )
      } catch {}
    })()
  }, [jwt, tenant])

  return (
    <div className="page" style={pageStyle}>
      {/* Sticky header (does not scroll with main) */}
      <div style={headerStyle}>
        <div style={locationStyle}>
          <span style={locationTitleStyle}>Delivering to Home</span>
          <span style={locationSubStyle}>Sector 21, Gurgaon</span>
        </div>
        <div style={avatarStyle} />
      </div>

      {/* Main scroll area */}
      <main style={mainStyle}>
        {/* Order again block (subtle, minimal) */}
        {lastOrder && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ fontSize: '13px', color: '#111' }}>{`Order again from ${lastOrder.storeName}`}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                style={{ height: 30, padding: '0 12px', borderRadius: 8, border: 'none', background: '#1AA6A6', color: '#FFFFFF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                onClick={() => {
                  try {
                    prefillCart(lastOrder.items)
                    window.localStorage.setItem('repeatOrderingActive', '1')
                  } catch {}
                  try { track('order_reordered', { storeId: lastOrder.storeId, itemsCount: lastOrder.items.length }) } catch {}
                  const target = lastOrder.storeId ? `#/store?id=${encodeURIComponent(lastOrder.storeId)}` : '#/store'
                  window.location.hash = target
                }}
              >
                Order again
              </button>
              <button
                type="button"
                style={{ background: 'transparent', border: 'none', color: '#1AA6A6', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                onClick={() => {
                  const target = lastOrder.storeId ? `#/store?id=${encodeURIComponent(lastOrder.storeId)}` : '#/store'
                  window.location.hash = target
                }}
              >
                View store
              </button>
            </div>
          </div>
        )}
        {/* Search bar section */}
        <div style={searchSectionStyle}>
          <input
            type="text"
            placeholder="Search for groceries, fruits, vegetables"
            style={searchInputStyle}
            aria-label="Search"
          />
        </div>

        {/* Category grid */}
        <div style={categoryWrapStyle}>
          <div style={gridStyle}>
            {categories.map((c) => (
              <div
                key={c.label}
                style={{ ...categoryCardStyle, cursor: 'default' }}
                onClick={() => {
                  console.log('Category click:', c)
                }}
              >
                <div style={categoryIconStyle}>{c.icon || '🛒'}</div>
                <div style={categoryLabelStyle}>{c.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Store list */}
        <div style={sectionTitleStyle}>Nearby stores</div>
        {/* Skeletons while loading */}
        {storesLoading && (
          <>
            {[0, 1, 2].map((i) => (
              <div key={`skeleton-${i}`} style={storeCardStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ width: 140, height: 12, background: '#F3F4F6', borderRadius: 6 }} />
                  <div style={{ width: 100, height: 10, background: '#F3F4F6', borderRadius: 6 }} />
                </div>
                <div style={{ width: 64, height: 24, background: '#F3F4F6', borderRadius: 999 }} />
              </div>
            ))}
          </>
        )}

        {/* Empty state after fetch with empty array */}
        {!storesLoading && stores.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
            <span style={{ fontSize: 14, color: '#777' }}>No stores available in your area</span>
          </div>
        )}

        {/* Actual stores list */}
        {!storesLoading && stores.map((s) => (
          <div
            key={s.name}
            style={{ ...storeCardStyle, cursor: 'pointer' }}
            onClick={() => {
              console.log('[PROOF][FE] Store clicked', s.id)
              if (!s.id) return
              window.location.hash = `#/store?id=${encodeURIComponent(s.id)}`
            }}
          >
            <div style={storeMetaStyle}>
              <div style={storeNameStyle}>{s.name}</div>
              <div style={storeDistanceStyle}>{s.distance}</div>
            </div>
            <div style={etaBadgeStyle}>{s.eta}</div>
          </div>
        ))}
      </main>
    </div>
  )
}