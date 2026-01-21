import { useEffect, useState } from 'react'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../api/client'
import { track } from '../utils/track'

export default function Store() {
  const { jwt } = useAuth()
  const { addItem, getQuantity, increment, decrement } = useCart()
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || ''
  const [storeName, setStoreName] = useState<string>('Store')
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    background: '#FFFFFF',
  }

  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 20,
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 16px',
    background: '#FFFFFF',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  }

  const backIconStyle: React.CSSProperties = {
    fontSize: '18px',
    color: '#666666',
    lineHeight: 1,
    cursor: 'pointer',
  }

  const headerTitleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#111111',
  }

  const mainStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 12px',
    paddingBottom: '72px', // to avoid footer overlap
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
  }

  const cardStyle: React.CSSProperties = {
    background: '#FAFAFA',
    borderRadius: '6px',
    padding: '4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
  }

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '72px',
    background: '#F3F4F6',
    borderRadius: '6px',
    backgroundSize: 'contain',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
  }

  const nameStyle: React.CSSProperties = {
    fontSize: '12px',
    lineHeight: '14px',
    fontWeight: 500,
    color: '#111111',
    marginTop: '4px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  }

  const bottomRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '4px',
  }

  const priceStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111111',
  }

  const addBtnStyle: React.CSSProperties = {
    height: '28px',
    padding: '0 12px',
    borderRadius: '6px',
    background: '#1AA6A6',
    color: '#FFFFFF',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
  }

  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; qty?: string; image?: string }>>([])
  const [productsLoading, setProductsLoading] = useState<boolean>(false)
  useEffect(() => {
    console.log('Store mounted')
  }, [])

  useEffect(() => {
    // Parse hash for storeId / categoryId
    const hash = typeof window !== 'undefined' ? window.location.hash || '' : ''
    const queryString = hash.includes('?') ? hash.split('?')[1] : ''
    const params = new URLSearchParams(queryString)
    const storeIdFromUrl = params.get('id') || ''

    // Determine effective store id strictly from URL
    const effectiveStoreId = storeIdFromUrl

    // Proof log: confirm storeId used by Store page
    console.log('[PROOF][FE] Store page storeId=', effectiveStoreId)
    // Track store viewed when we have a valid store id and jwt
    try { if (jwt && effectiveStoreId) track('store_viewed', { storeId: effectiveStoreId }) } catch {}

    // Skip if unauthenticated or no store id available; keep grid empty gracefully
    if (!jwt || !effectiveStoreId) {
      if (!effectiveStoreId) console.warn('Store: missing storeId in URL; showing empty grid')
      return
    }

    const ctx = { jwt, tenant }
    ;(async () => {
      try {
        // Fetch store detail (no UI change, but required per policy)
        const detail = await apiFetch<any>(`/api/storefront/stores/${encodeURIComponent(effectiveStoreId)}`, { method: 'GET' }, ctx)
        setStoreName(detail?.name || detail?.store?.name || 'Store')
      } catch (e) {
        console.warn('Store detail load error', e)
      }

      try {
        setProductsLoading(true)
        // Fetch storefront products for the store
        const resp = await apiFetch<any[]>(`/api/storefront/stores/${encodeURIComponent(effectiveStoreId)}/products`, { method: 'GET' }, ctx)
        const normalized = (resp || []).map((p: any) => ({
          id: String(p.id),
          name: p.name || 'Product',
          price: Number(p.price ?? 0),
          qty: p.quantityLabel || p.qty,
          image: p.image,
        }))
        setProducts(normalized)
      } catch (e) {
        console.warn('Store products load error', e)
        setProducts([])
      } finally {
        setProductsLoading(false)
      }
    })()
  }, [jwt, tenant])

  return (
    <div className="page" style={pageStyle}>
      {/* Sticky header */}
      <div style={headerStyle}>
        <span
          style={backIconStyle}
          onClick={() => { window.location.hash = '#/home' }}
        >
          ←
        </span>
        <span style={headerTitleStyle}>{storeName}</span>
      </div>

      {/* Scrollable content area */}
      <main style={mainStyle}>
        <div style={gridStyle}>
          {/* Skeletons while loading */}
          {productsLoading && (
            <>
              {[0,1,2,3,4,5].map((i) => (
                <div key={`skeleton-${i}`} style={cardStyle}>
                  <div style={imageStyle} />
                  <div style={{ width: '100%', height: 12, background: '#F3F4F6', borderRadius: 6, marginTop: 4 }} />
                  <div style={{ width: '80%', height: 12, background: '#F3F4F6', borderRadius: 6, marginTop: 6 }} />
                  <div style={bottomRowStyle}>
                    <div style={{ width: 60, height: 16, background: '#F3F4F6', borderRadius: 6 }} />
                    <div style={{ width: 72, height: 28, background: '#F3F4F6', borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Empty state after fetch with empty array */}
          {!productsLoading && products.length === 0 && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <span style={{ fontSize: 14, color: '#777' }}>No products available right now</span>
            </div>
          )}

          {/* Actual products grid */}
          {!productsLoading && products.map((p) => (
            <div key={p.id} style={cardStyle}>
              <div
                style={
                  p.image
                    ? { ...imageStyle, backgroundImage: `url(${p.image})` }
                    : imageStyle
                }
              />
              <div style={nameStyle}>{p.name}</div>
              <div style={bottomRowStyle}>
                <div style={priceStyle}>{`₹${p.price}`}</div>
                {getQuantity(p.id) === 0 ? (
                  <button
                    type="button"
                    style={addBtnStyle}
                    onClick={() => {
                      try { track('product_added_to_cart', { productId: p.id }) } catch {}
                      addItem({ productId: p.id, name: p.name, price: p.price })
                    }}
                  >
                    ADD
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button type="button" onClick={() => decrement(p.id)} style={{ ...addBtnStyle, background: '#FFFFFF', color: '#1AA6A6', border: '1px solid #1AA6A6', borderRadius: '6px' }}>-</button>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{getQuantity(p.id)}</span>
                    <button type="button" onClick={() => increment(p.id)} style={{ ...addBtnStyle, borderRadius: '6px' }}>+</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}