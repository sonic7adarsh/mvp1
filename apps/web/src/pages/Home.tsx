import React, { useEffect, useState } from 'react'
import { useAuth } from '../AuthContext'
import { getStores, getCategories } from '../api/endpoints'
import { Skeleton } from '../components/Skeleton'
import { StoreCard } from '../components/StoreCard'
import type { Store } from '../components/StoreCard'
import { useLocation } from '../context/LocationContext'
import { LocationBottomSheet } from '../components/LocationBottomSheet'
import { CategoryGrid } from '../components/CategoryGrid'
import { useTranslation } from 'react-i18next'

export default function Home() {
  const { t } = useTranslation()
  const { jwt } = useAuth()
  const { location, isDetecting } = useLocation()
  
  const [stores, setStores] = useState<Store[]>([])
  const [loading, setLoading] = useState(true)
  const [, setError] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>(['all'])
  const [searchQuery, setSearchQuery] = useState('')
  const [showLocationSheet, setShowLocationSheet] = useState(false)

  // Handle URL params for deep linking (e.g. from Cart)
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('?')) {
      const query = hash.split('?')[1]
      const params = new URLSearchParams(query)
      const cat = params.get('category')
      if (cat) {
        setSelectedCategory(cat)
      }
    }
  }, [])

  // STRICT: NO Auto-Fetch on load. User must initiate.
  
  // Fetch Stores when location is available
  useEffect(() => {
    // Precise Location: Strictly depends on lat/lng being available
    if (!location?.confirmed) return

    async function fetchStores() {
      setLoading(true)
      setError('')
      try {
        // Pass precise coords for backend filtering
        const lat = location?.lat || 0
        const lng = location?.lng || 0
        const data = await getStores(lat, lng, { jwt })
        setStores(data || [])
      } catch (e) {
        console.error(e)
        setError('Failed to load stores')
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [location, jwt])

  // Safe Filtering Logic (Prevent Crashes)
  const filteredStores = React.useMemo(() => {
    if (!Array.isArray(stores)) return []
    
    return stores.filter(store => {
      // Guard against missing object
      if (!store) return false

      // Category Filter
      const storeCategory = (store as any).category || store.type || ''
      
      if (selectedCategory !== 'all') {
         if (!storeCategory || storeCategory.toLowerCase() !== selectedCategory.toLowerCase()) {
           return false
         }
      }

      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const name = store.name ? store.name.toLowerCase() : ''
        if (!name.includes(query)) return false
      }

      return true
    })
  }, [stores, selectedCategory, searchQuery])

  // Fetch Categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await getCategories({ jwt })
        if (Array.isArray(cats)) {
          // Robust mapping for strings or objects
          const mapped = cats.map((c: any) => {
             if (typeof c === 'string') return c.toLowerCase()
             // Try common fields for category name/slug
             return c.slug || c.name || c.id || ''
          }).filter(Boolean)
          
          const unique = Array.from(new Set(['all', ...mapped]))
          setCategories(unique)
        }
      } catch (e) {
        console.error('Category fetch failed', e)
      }
    }
    fetchCategories()
  }, [jwt])

  // UI STYLES - LIGHT THEME
  const pageStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    background: '#F9FAFB', // Light Theme Background
    height: '100%', // Fill parent height
    overflowY: 'auto', // Handle scrolling internally
    paddingBottom: '62px', // Minimal buffer for 60px Bottom Nav
    color: '#111827', // Primary Text
  }

  // Sticky Header
  const headerStyle: React.CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 50, 
    backgroundColor: '#c9f2f6', // User specified Cyan
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', // Subtle shadow
    flexShrink: 0,
    borderBottom: '1px solid #A5E0E6', // Slightly darker Cyan border
  }

  const headerTopRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    width: '100%',
    boxSizing: 'border-box',
    gap: '12px',
  }

  const searchContainerStyle: React.CSSProperties = {
    padding: '0 16px 12px 16px',
    width: '100%',
    boxSizing: 'border-box',
  }

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #A5E0E6', // Slightly darker Cyan border
    background: '#FFFFFF', // White input looks cleaner on Cyan header
    fontSize: '14px',
    color: '#111827', // Dark text
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  }

  const locationInfoStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    overflow: 'hidden',
    cursor: 'pointer',
    userSelect: 'none',
  }

  const locationLabelStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    color: '#111827', // Dark text
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    lineHeight: '1.2',
  }

  const locationSubStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B7280', // Secondary text
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    marginTop: '2px',
  }

  const categoriesCardStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '16px',
    margin: '16px 16px 16px 16px', // Side margins + bottom + top
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  }

  const sectionTitleStyle: React.CSSProperties = {
    marginBottom: '12px',
    fontWeight: 600,
    color: '#111827',
    fontSize: '16px',
  }

  const logoStyle: React.CSSProperties = {
    display: 'block',
    width: '56px', // Increased size for new logo
    height: '56px',
    objectFit: 'contain',
  }

  // 3. Store Listing
  const listContainerStyle: React.CSSProperties = {
    padding: '0 16px 4px 16px', 
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '2px', // Ultra tight gap
  }

  const emptyStateStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    color: '#6B7280',
    marginTop: '40px'
  }

  return (
    <div className="no-scrollbar" style={pageStyle}>
      {/* Top Location Bar + Search (Sticky) */}
      <header style={headerStyle}>
        <div style={headerTopRowStyle}>
          {/* Brand Logo */}
          <img src="/city_mart_logo.svg?v=5" alt="City Mart" style={logoStyle} />

          {/* Location Info */}
          <div 
            style={locationInfoStyle} 
            onClick={() => setShowLocationSheet(true)}
            role="button"
            tabIndex={0}
          >
            <div style={locationLabelStyle}>
              {/* Logic: Show "Select location" if not confirmed. Show City Name if confirmed. */}
              <span>
                {!location?.confirmed 
                  ? t('common.select_location')
                  : (location.label === 'Current Location' ? t('common.nearby') : location.label)
                }
              </span>
              <span style={{ fontSize: '10px', color: '#111827' }}>▼</span>
            </div>
            {location?.confirmed && (
               <div style={locationSubStyle}>
                 {location.subLabel || t('common.delivering_here')}
               </div>
            )}
          </div>
        </div>

        <div style={searchContainerStyle}>
          <input
            type="text"
            placeholder={t('common.search_placeholder')}
            style={searchInputStyle}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* Category Section (Separate Card, Scrollable with page) */}
      <div style={{ padding: '0 16px', marginTop: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '18px' }}>📑</span>
        <div style={{ ...sectionTitleStyle, marginBottom: 0 }}>
          {t('common.categories')}
        </div>
      </div>

      <div style={{ ...categoriesCardStyle, marginTop: '4px', padding: 0 }}>
        {/* Category Grid (Horizontal Scroll) */}
        <CategoryGrid 
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>

      {/* Stores List */}
      <div style={{ padding: '0 16px', marginTop: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '20px' }}>🛍️</span>
        <div style={{ ...sectionTitleStyle, marginBottom: 0 }}>
          {t('common.stores_near_you')}
        </div>
      </div>

      <div style={listContainerStyle}>
        {!location?.confirmed ? (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {isDetecting ? '⌛' : '📍'}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#111827' }}>
              {isDetecting ? t('home.detecting_location') : t('home.location_needed')}
            </h3>
            <p style={{ maxWidth: '280px', margin: '0 auto' }}>
              {isDetecting ? t('home.detecting_desc') : t('home.location_needed_desc')}
            </p>
            <button 
              onClick={() => setShowLocationSheet(true)}
              style={{
                marginTop: '24px',
                background: '#111827',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {t('home.select_location_btn')}
            </button>
          </div>
        ) : loading ? (
          // Skeleton Loading
          Array.from({ length: 5 }).map((_, i) => (
             <Skeleton key={i} height={120} style={{ marginBottom: '16px', borderRadius: '16px' }} />
          ))
        ) : filteredStores.length > 0 ? (
          filteredStores.map(store => (
            <StoreCard 
              key={store.id} 
              store={store} 
              onClick={() => {
                window.location.hash = `/stores/${store.id}`
              }} 
            />
          ))
        ) : (
          <div style={emptyStateStyle}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#111827' }}>
              {t('home.no_stores')}
            </h3>
            <p>{t('home.try_different_location')}</p>
          </div>
        )}
      </div>

      <LocationBottomSheet 
        isOpen={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
      />
    </div>
  )
}
