import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../AuthContext'
import { useToast } from '../ToastContext'
import { apiFetch } from '../api/client'
import { Plus, Search, Filter, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type Product = {
  id: string
  name: string
  category?: string
  price: number
  available_qty: number
  active: boolean
}

export default function SellerProducts() {
  const { t } = useTranslation()
  const { jwt } = useAuth()
  const { showToast } = useToast() // Added showToast usage

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [storeId, setStoreId] = useState<string>('')
  const [storeCategory, setStoreCategory] = useState<string>('')
  const [categories, setCategories] = useState<any[]>([]) // Added categories state
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Add Product Form State
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    categoryId: '', // Added categoryId
    price: '',
    quantity: '10',
    active: true
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
    if (jwt) {
      fetchProducts()
      fetchCategories()
    }
  }, [jwt])

  const fetchCategories = async () => {
    try {
      const res = await apiFetch<any[]>('/api/storefront/categories', {}, { jwt })
      if (Array.isArray(res)) {
        setCategories(res)
      }
    } catch (e) {
      console.error('Failed to fetch categories', e)
    }
  }

  // Pre-select category if store category matches
  useEffect(() => {
    if (storeCategory && categories.length > 0 && !newProduct.categoryId) {
      const match = categories.find(c => (c.name || c.slug || '').toLowerCase() === storeCategory.toLowerCase())
      if (match) {
        setNewProduct(prev => ({ ...prev, categoryId: match.id, category: match.name || match.slug }))
      }
    }
  }, [storeCategory, categories])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      let sId = storeId
      if (!sId) {
        // Fetch store ID from /api/seller/store
        try {
            const storeRes = await apiFetch<any>('/api/seller/store', {}, { jwt })
            if (storeRes && storeRes.id) {
                sId = storeRes.id
                setStoreId(sId)
                if (storeRes.category) setStoreCategory(storeRes.category)
            }
        } catch (e) {
            console.error('Failed to fetch store context', e)
        }
      }

      if (sId) {
          const res = await apiFetch<Product[]>(`/api/seller/stores/${sId}/products`, {}, { jwt })
          if (Array.isArray(res)) {
            setProducts(res)
          }
      } else {
          // Fallback to old/missing API if store ID not found
          const res = await apiFetch<Product[]>('/api/seller/products', {}, { jwt })
          if (Array.isArray(res)) {
            setProducts(res)
          }
      }
    } catch (e) {
      console.error('Failed to fetch products', e)
    } finally {
      setLoading(false)
    }
  }

  const toggleAvailability = async (product: Product) => {
    // Optimistic update
    const oldStatus = product.active
    const newStatus = !oldStatus
    
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: newStatus } : p))

    try {
      // Contract: PATCH /seller/products/{productId} with body { active: boolean }
      // Or /seller/stores/{storeId}/products/{productId}?
      // Using direct product endpoint for now as it usually has unique ID
      await apiFetch(`/api/seller/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newStatus })
      }, { jwt })
    } catch (e) {
      console.error('Failed to toggle availability', e)
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: oldStatus } : p))
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProduct.name || !newProduct.price) {
      setErrorMsg(t('products.errors.name_price_required'))
      return
    }
    
    if (!storeId) {
        setErrorMsg(t('products.errors.store_missing'))
        return
    }

    try {
      setSubmitting(true)
      setErrorMsg('')
      
      // Use nested endpoint if storeId is available
      const url = `/api/seller/stores/${storeId}/products`
      
      const res = await apiFetch<any>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      }, { jwt })

      if (res && (res.success || res.id)) {
        setShowAddModal(false)
        setNewProduct({
          name: '',
          category: storeCategory || '',
          categoryId: '',
          price: '',
          quantity: '10',
          active: true
        })
        fetchProducts()
        showToast(t('products.success_added'), 'success') // showToast was missing in imports?
      } else {
        setErrorMsg(res.message || t('products.errors.failed_add'))
      }
    } catch (e: any) {
      console.error('Add product error', e)
      setErrorMsg(e.message || t('products.errors.failed_add'))
    } finally {
      setSubmitting(false)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Styles
  const headerStyle: React.CSSProperties = {
    padding: '16px',
    background: '#fff',
    position: 'fixed',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '420px',
    zIndex: 10,
    borderBottom: '1px solid var(--border)'
  }

  const headerTitleRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  }

  const searchStyle: React.CSSProperties = {
    background: '#F3F4F6',
    borderRadius: 12,
    height: 44,
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    color: 'var(--text-secondary)',
    border: '1px solid transparent'
  }

  const searchInputStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    fontSize: 14,
    flex: 1,
    marginLeft: 8,
    outline: 'none',
    color: 'var(--text-primary)'
  }

  const titleStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--text-primary)'
  }

  const addBtnStyle: React.CSSProperties = {
    background: 'var(--primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: 6
  }

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 'var(--radius)',
    padding: 16,
    marginBottom: 12,
    boxShadow: 'var(--shadow-card)',
    display: 'flex',
    alignItems: 'center',
    gap: 12
  }

  const iconBoxStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 8,
    background: 'var(--bg-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-secondary)'
  }

  const contentStyle: React.CSSProperties = {
    flex: 1
  }

  const nameStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginBottom: 4
  }

  const categoryStyle: React.CSSProperties = {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginBottom: 4
  }

  const priceStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--text-primary)'
  }

  // Toggle Switch
  const toggleStyle = (on: boolean): React.CSSProperties => ({
    width: 44,
    height: 24,
    borderRadius: 12,
    background: on ? '#10B981' : '#E5E7EB',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background 0.2s'
  })

  const knobStyle = (on: boolean): React.CSSProperties => ({
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: 2,
    left: 2,
    transform: on ? 'translateX(20px)' : 'translateX(0)',
    transition: 'transform 0.2s',
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
  })

  const SkeletonProduct = () => (
    <div style={{...cardStyle, pointerEvents: 'none'}} className="animate-pulse">
      <div style={{...iconBoxStyle, background: '#E5E7EB'}}></div>
      <div style={contentStyle}>
        <div style={{height: 16, width: 140, background: '#E5E7EB', borderRadius: 4, marginBottom: 8}}></div>
        <div style={{height: 12, width: 80, background: '#E5E7EB', borderRadius: 4, marginBottom: 8}}></div>
        <div style={{height: 14, width: 60, background: '#E5E7EB', borderRadius: 4}}></div>
      </div>
      <div style={{width: 44, height: 24, borderRadius: 12, background: '#E5E7EB'}}></div>
    </div>
  )

  return (
    <div style={{ padding: '150px 0 80px 0' }}>
      <div style={headerStyle}>
        <div style={headerTitleRow}>
          <h1 style={titleStyle}>{t('products.title')}</h1>
          <button style={addBtnStyle} onClick={() => {
             setNewProduct(prev => ({ ...prev, category: storeCategory || '' }))
             setShowAddModal(true)
          }}>
            <Plus size={18} />
            {t('products.add_new')}
          </button>
        </div>
        
        <div style={searchStyle}>
          <Search size={18} />
          <input 
            placeholder={t('products.search_placeholder')}
            style={searchInputStyle}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <>
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
            <SkeletonProduct />
          </>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
            <p>{t('products.no_products')}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
           <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
             <p>{t('products.no_results')} "{searchQuery}"</p>
           </div>
        ) : (
          filteredProducts.map(p => (
            <div key={p.id} style={cardStyle}>
              <div style={iconBoxStyle}>
                <Package size={24} />
              </div>
              <div style={contentStyle}>
                <div style={nameStyle}>{p.name}</div>
                <div style={categoryStyle}>{p.category || t('products.uncategorized')}</div>
                <div style={priceStyle}>₹{p.price}</div>
              </div>
              <div style={toggleStyle(p.active)} onClick={() => toggleAvailability(p)}>
                <div style={knobStyle(p.active)} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 360, borderRadius: 16, padding: 24,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{t('products.add_product_title')}</h2>
            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>{t('products.product_name')}</label>
                <input
                  style={{ width: '100%', height: 40, border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', boxSizing: 'border-box' }}
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  placeholder={t('products.name_placeholder')}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>{t('products.price')}</label>
                <input
                  type="number"
                  style={{ width: '100%', height: 40, border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', boxSizing: 'border-box' }}
                  value={newProduct.price}
                  onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                  placeholder={t('products.price_placeholder')}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6, color: 'var(--text-secondary)' }}>{t('products.category')}</label>
                <select
                  style={{ width: '100%', height: 40, border: '1px solid var(--border)', borderRadius: 8, padding: '0 12px', boxSizing: 'border-box', background: '#fff' }}
                  value={newProduct.categoryId}
                  onChange={e => {
                    const selectedId = e.target.value
                    const cat = categories.find(c => c.id === selectedId)
                    setNewProduct({
                      ...newProduct,
                      categoryId: selectedId,
                      category: cat ? (cat.name || cat.slug || '') : ''
                    })
                  }}
                >
                  <option value="">{t('products.select_category')}</option>
                  {categories.map((c: any) => {
                    const catName = c.name || c.slug
                    return (
                      <option key={c.id} value={c.id}>
                        {catName ? t(`categories.${catName}`, { defaultValue: catName }) : t('common.unknown')}
                      </option>
                    )
                  })}
                </select>
              </div>

              {errorMsg && <p style={{ color: '#EF4444', fontSize: 13 }}>{errorMsg}</p>}

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, height: 44, border: '1px solid var(--border)', borderRadius: 8, background: '#fff', fontWeight: 600 }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ flex: 1, height: 44, border: 'none', borderRadius: 8, background: 'var(--primary)', color: '#fff', fontWeight: 600 }}
                >
                  {submitting ? t('products.adding') : t('products.add_product_btn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
