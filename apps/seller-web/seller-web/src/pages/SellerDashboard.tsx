import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../AuthContext'
import { apiFetch } from '../api/client'
import { ShoppingBag, ClipboardList, Banknote, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function SellerDashboard() {
  const { t } = useTranslation()
  const { jwt } = useAuth()

  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ today: 0, pending: 0, products: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (jwt) {
      loadData()
    }
  }, [jwt])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // 1. Fetch Store Context (Using GET /api/seller/store)
      let storeData = null
      let storeId = ''
      
      try {
        const storeRes = await apiFetch<any>('/api/seller/store', {}, { jwt })
        storeData = storeRes
        storeId = storeRes.id
      } catch (e) {
        console.error('Failed to fetch store info', e)
        // Fallback: Try /stores just in case
        try {
          const storesRes = await apiFetch<any>('/api/seller/stores', {}, { jwt })
          const stores = storesRes.stores || (Array.isArray(storesRes) ? storesRes : [])
          if (stores.length > 0) {
            const firstStore = stores[0]
            storeId = firstStore.id
            storeData = { ...firstStore }
          }
        } catch {}
      }

      if (storeData) {
        // Normalize store data
        storeData = {
            ...storeData,
            store_name: storeData.store_name || storeData.name,
            address: storeData.address || {
                city: storeData.city,
                area: storeData.area,
                // Add other fields if needed
            }
        }
      }

      setProfile(storeData)

      // 2. Fetch Stats (GET /api/seller/dashboard-stats)
      let statsData = { today: 0, pending: 0, earnings: 0 }
      try {
        statsData = await apiFetch<any>('/api/seller/dashboard-stats', {}, { jwt })
      } catch (e) {
        console.error('Failed to fetch stats', e)
      }

      // 3. Fetch Products (Use storeId if available)
      let productsData: any[] = []
      try {
        if (storeId) {
            productsData = await apiFetch<any[]>(`/api/seller/stores/${storeId}/products`, {}, { jwt })
        } else {
             console.warn('No store context for dashboard products')
        }
      } catch (e) {
        console.warn('Products API failed', e)
      }

      setStats({
        today: statsData.today || 0,
        pending: statsData.pending || 0,
        products: Array.isArray(productsData) ? productsData.length : 0,
        earnings: statsData.earnings || 0
      })
    } catch (e) {
      console.error('Failed to load dashboard data', e)
    } finally {
      setLoading(false)
    }
  }

  const headerStyle: React.CSSProperties = {
    padding: '16px 20px',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid var(--border)'
  }

  const storeInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12
  }

  const storeIconStyle: React.CSSProperties = {
    width: 40, height: 40, borderRadius: 20,
    background: 'var(--primary-light)',
    color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 18, fontWeight: 700, margin: '24px 20px 16px', color: 'var(--text-primary)'
  }

  // Horizontal Scroll Stats
  const statsScrollStyle: React.CSSProperties = {
    display: 'flex',
    overflowX: 'auto',
    gap: 12,
    padding: '0 20px',
    paddingBottom: 4, // space for shadow
    scrollbarWidth: 'none'
  }

  const statCardStyle = (color: string): React.CSSProperties => ({
    minWidth: 140,
    height: 100,
    background: color,
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: '#fff',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    flexShrink: 0
  })

  // Grid Actions
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
    padding: '0 20px',
    marginBottom: 80
  }

  const actionCardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 16,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    boxShadow: 'var(--shadow-sm)',
    cursor: 'pointer',
    border: '1px solid var(--border)'
  }

  const actionIconStyle: React.CSSProperties = {
    width: 48, height: 48, borderRadius: 24,
    background: '#F9FAFB',
    color: 'var(--primary)',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  }

  const SkeletonStatCard = () => (
    <div style={{...statCardStyle('#F3F4F6'), color: 'transparent', boxShadow: 'none'}} className="animate-pulse">
       <div style={{width: 40, height: 28, background: '#D1D5DB', borderRadius: 4, marginBottom: 8}}></div>
       <div style={{width: 80, height: 16, background: '#D1D5DB', borderRadius: 4}}></div>
    </div>
  )

  const navigate = (path: string) => {
    window.location.hash = path
  }

  return (
    <div>
      {/* Header */}
      <div style={headerStyle}>
        <div style={storeInfoStyle}>
          <div style={storeIconStyle}>
            <Store size={20} />
          </div>
          <div>
            {loading ? (
               <div className="animate-pulse">
                 <div style={{width: 100, height: 16, background: '#E5E7EB', borderRadius: 4, marginBottom: 4}}></div>
                 <div style={{width: 60, height: 12, background: '#E5E7EB', borderRadius: 4}}></div>
               </div>
            ) : (
               <>
                 <div style={{ fontSize: 16, fontWeight: 700 }}>{profile?.store_name || t('dashboard.my_store')}</div>
                 <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                   {profile?.address?.city || t('dashboard.location')}
                 </div>
               </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={sectionTitleStyle}>{t('dashboard.quick_stats')}</div>
      <div style={statsScrollStyle} className="no-scrollbar">
        {loading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <div style={statCardStyle('var(--primary)')}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.today}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{t('dashboard.today_orders')}</div>
            </div>
            <div style={statCardStyle('#F59E0B')}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.pending}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{t('dashboard.pending_orders')}</div>
            </div>
            <div style={statCardStyle('#3B82F6')}>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{stats.products}</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>{t('dashboard.total_products')}</div>
            </div>
          </>
        )}
      </div>

      {/* Main Actions */}
      <div style={sectionTitleStyle}>{t('dashboard.manage_store')}</div>
      <div style={gridStyle}>
        <div style={actionCardStyle} onClick={() => navigate('/products')}>
          <div style={actionIconStyle}><ShoppingBag size={24} strokeWidth={1.5} /></div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t('dashboard.products')}</span>
        </div>
        <div style={actionCardStyle} onClick={() => navigate('/orders')}>
          <div style={actionIconStyle}><ClipboardList size={24} strokeWidth={1.5} /></div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t('dashboard.orders')}</span>
        </div>
        <div style={actionCardStyle} onClick={() => navigate('/earnings')}>
          <div style={actionIconStyle}><Banknote size={24} strokeWidth={1.5} /></div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{t('dashboard.earnings')}</span>
        </div>
      </div>
    </div>
  )
}
