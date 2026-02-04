import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCart } from '../CartContext'
import { useAuth } from '../AuthContext'
import { getProductsByCategory } from '../api/endpoints'
import { track } from '../utils/track'
import { Skeleton } from '../components/Skeleton'
import { ProductCard } from '../components/ProductCard'
import { useLocation } from '../context/LocationContext'

export default function CategoryProducts() {
  const { t } = useTranslation()
  const { jwt } = useAuth()
  const { location } = useLocation()
  const { clearCart, addItem } = useCart()
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [categoryName, setCategoryName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  
  // Conflict Modal State
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [pendingItem, setPendingItem] = useState<any>(null)

  useEffect(() => {
    // Parse hash: #/category/123?name=Dairy
    const hash = window.location.hash
    const parts = hash.split('/')
    if (parts.length >= 3) {
      const rawId = parts[2]
      const [id, query] = rawId.split('?')
      setCategoryId(id)
      
      if (query) {
        const params = new URLSearchParams(query)
        const name = params.get('name')
        if (name) setCategoryName(decodeURIComponent(name))
      }
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        // Removed real lat/lng
        const res = await getProductsByCategory(categoryId, 0, 0, { jwt })
        const normalized = (res || []).map((p: any) => ({
          id: String(p.id),
          name: p.name || 'Product',
          price: Number(p.price ?? 0),
          unit: p.unit || 'unit',
          image: p.image,
          storeId: p.storeId || p.store_id
        }))
        setProducts(normalized)
      } catch (e) {
        setError(t('category.error'))
      } finally {
        setLoading(false)
      }
    }
    load()
    track('category_viewed', { categoryId })
  }, [categoryId, jwt, location])

  const handleConflict = (product: any) => {
    setPendingItem(product)
    setShowConflictModal(true)
  }

  const confirmChangeStore = () => {
    if (pendingItem) {
      clearCart()
      addItem({
        productId: pendingItem.id,
        name: pendingItem.name,
        price: pendingItem.price,
        storeId: pendingItem.storeId,
        quantity: 1
      })
      try { track('product_added_to_cart', { productId: pendingItem.id }) } catch {}
    }
    setPendingItem(null)
    setShowConflictModal(false)
  }

  // Safety Gate UI
  if (!location?.confirmed) {
     return <div style={{ padding: 20 }}>{t('category.redirect_location')}</div>
  }

  const pageStyle: React.CSSProperties = {
    padding: '16px',
    paddingBottom: '80px',
    minHeight: '100vh',
    background: '#F9FAFB'
  }

  const headerStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  const backButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 8px 0 0'
  }

  const emptyStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#6B7280'
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <button style={backButtonStyle} onClick={() => window.location.hash = '/home'}>←</button>
        {categoryName || 'Products'}
      </div>

      {loading ? (
        <>
          {[1, 2, 3].map(i => (
             <div key={i} style={{ display: 'flex', gap: 12, padding: 12, background: '#FFF', borderRadius: 12, marginBottom: 12 }}>
                <Skeleton width={64} height={64} borderRadius={8} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                   <Skeleton width="60%" height={16} />
                   <Skeleton width="40%" height={16} />
                </div>
             </div>
          ))}
        </>
      ) : error ? (
        <div style={emptyStyle}>{error}</div>
      ) : products.length === 0 ? (
        <div style={emptyStyle}>No items available nearby for this category</div>
      ) : (
        products.map(p => (
          <ProductCard 
            key={p.id} 
            product={p} 
            onConflict={handleConflict}
          />
        ))
      )}

      {/* Conflict Modal */}
      {showConflictModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{ background: '#FFF', borderRadius: 12, padding: 24, width: '100%', maxWidth: 320 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{t('store.conflict_title')}</h3>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 20 }}>
              {t('store.conflict_desc')}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowConflictModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #E5E7EB', background: '#FFF', fontWeight: 600 }}
              >
                {t('common.no')}
              </button>
              <button
                onClick={confirmChangeStore}
                style={{ flex: 1, padding: '10px', borderRadius: 8, background: '#111827', color: '#FFF', fontWeight: 600, border: 'none' }}
              >
                {t('store.conflict_yes_start_new')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
