import { useEffect, useState } from 'react'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../api/client'
import { track } from '../utils/track'

export default function Store() {
  const { jwt } = useAuth()
  const { addItem, getQuantity, increment, decrement, items, clearCart } = useCart()
  const tenant = (import.meta as any).env?.VITE_DEFAULT_TENANT || 'tenantA'
  const [storeName, setStoreName] = useState<string>('Store')
  const [currentStoreId, setCurrentStoreId] = useState<string>('')
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [pendingItem, setPendingItem] = useState<any>(null)

  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    background: '#FFFFFF',
    position: 'relative',
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
    background: '#c9f2f6', // User specified Cyan
    borderBottom: '1px solid #A5E0E6',
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
    padding: 0, // Removed padding to allow sticky elements to flush
    paddingBottom: '72px', 
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '6px',
    padding: '8px 12px', // Moved padding here
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
    background: '#111827', // Black
    color: '#FFFFFF',
    fontSize: '12px',
    border: 'none',
    cursor: 'pointer',
  }

  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; qty?: string; image?: string; category: string }>>([])
  const [productsLoading, setProductsLoading] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Search & Filter Logic
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))].sort()
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Styles for new elements
  const searchContainerStyle: React.CSSProperties = {
    padding: '12px 16px 8px 16px',
    background: '#FFFFFF',
    position: 'sticky',
    top: 0,
    zIndex: 19,
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '12px',
    border: '1px solid #E5E7EB',
    background: '#F9FAFB',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#111',
  }

  const categoriesContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    padding: '0 16px 12px 16px',
    background: '#FFFFFF',
    position: 'sticky',
    top: '54px', // Height of search container approx
    zIndex: 18,
    scrollbarWidth: 'none', 
  }

  const categoryChipStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '20px',
    background: isSelected ? '#111827' : '#F3F4F6',
    color: isSelected ? '#FFFFFF' : '#4B5563',
    fontSize: '13px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s',
  })

  useEffect(() => {
    console.log('Store mounted')
  }, [])

  useEffect(() => {
    // Parse hash for storeId / categoryId
    const hash = typeof window !== 'undefined' ? window.location.hash || '' : ''
    const queryString = hash.includes('?') ? hash.split('?')[1] : ''
    const params = new URLSearchParams(queryString)
    let storeIdFromUrl = params.get('id') || ''

    // Fallback: Check if hash matches /stores/:id
    if (!storeIdFromUrl) {
      const path = hash.split('?')[0].replace(/^#/, '') // e.g., /stores/123
      const match = path.match(/^\/stores\/([^/]+)/)
      if (match) {
        storeIdFromUrl = match[1]
      }
    }

    // Determine effective store id strictly from URL
    const effectiveStoreId = storeIdFromUrl
    setCurrentStoreId(effectiveStoreId)

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
          category: p.category?.name || p.category || 'Other',
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

  const handleAddItem = (p: any) => {
    // Check for store conflict
    const existingStoreId = items.length > 0 ? items[0].storeId : null
    
    // Trigger conflict if:
    // 1. Existing cart belongs to a different store
    // 2. Existing cart has NO store (legacy/broken items)
    if (items.length > 0 && existingStoreId !== currentStoreId) {
      setPendingItem(p)
      setShowConflictModal(true)
      return
    }

    try { track('product_added_to_cart', { productId: p.id }) } catch {}
    addItem({ productId: p.id, name: p.name, price: p.price, storeId: currentStoreId })
  }

  const confirmChangeStore = () => {
    clearCart()
    if (pendingItem) {
      try { track('product_added_to_cart', { productId: pendingItem.id }) } catch {}
      addItem({ productId: pendingItem.id, name: pendingItem.name, price: pendingItem.price, storeId: currentStoreId })
    }
    setPendingItem(null)
    setShowConflictModal(false)
  }

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
      <main className="no-scrollbar" style={mainStyle}>
        {/* Search Bar */}
        <div style={searchContainerStyle}>
          <input 
            type="text" 
            placeholder="Search products..." 
            style={searchInputStyle}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="no-scrollbar" style={categoriesContainerStyle}>
            {categories.map(cat => (
              <button
                key={cat}
                style={categoryChipStyle(selectedCategory === cat)}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

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

          {/* No matches state */}
          {!productsLoading && products.length > 0 && filteredProducts.length === 0 && (
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <span style={{ fontSize: 14, color: '#777' }}>No products match your search</span>
            </div>
          )}

          {/* Actual products grid */}
          {!productsLoading && filteredProducts.map((p) => (
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
                    onClick={() => handleAddItem(p)}
                  >
                    ADD
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button type="button" onClick={() => decrement(p.id)} style={{ ...addBtnStyle, background: '#FFFFFF', color: '#111827', border: '1px solid #111827', borderRadius: '6px' }}>-</button>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{getQuantity(p.id)}</span>
                    <button type="button" onClick={() => increment(p.id)} style={{ ...addBtnStyle, borderRadius: '6px' }}>+</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Conflict Modal */}
      {showConflictModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: '#FFF', borderRadius: 12, padding: 24, width: '100%', maxWidth: 320 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Start a new cart?</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              Your cart has items from another store. Do you want to discard them and add items from this store?
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConflictModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFF', fontWeight: 600 }}
              >
                No
              </button>
              <button
                onClick={confirmChangeStore}
                style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#111827', color: '#FFF', fontWeight: 600, border: 'none' }}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}