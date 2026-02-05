import React from 'react'
import { LayoutGrid, Package, ClipboardList, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface BottomNavProps {
  activeTab: string
  onNavigate: (path: string) => void
  ordersCount?: number
}

export default function BottomNav({ activeTab, onNavigate, ordersCount = 0 }: BottomNavProps) {
  const { t } = useTranslation()
  const navStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 420,
    height: 60,
    background: '#FFFFFF',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 50,
    boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
    paddingBottom: 'env(safe-area-inset-bottom, 0px)'
  }

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    padding: 0,
    flex: 1,
    height: '100%',
    color: isActive ? 'var(--primary)' : '#9CA3AF',
    cursor: 'pointer',
    position: 'relative' // For badge
  })

  const labelStyle = (isActive: boolean): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 500,
    marginTop: 4,
    color: isActive ? 'var(--primary)' : '#6B7280'
  })

  return (
    <nav style={navStyle}>
      <button style={tabStyle(activeTab === 'dashboard')} onClick={() => onNavigate('/dashboard')}>
        <LayoutGrid size={24} strokeWidth={1.5} />
        <span style={labelStyle(activeTab === 'dashboard')}>{t('nav.dashboard')}</span>
      </button>

      <button style={tabStyle(activeTab === 'products')} onClick={() => onNavigate('/products')}>
        <Package size={24} strokeWidth={1.5} />
        <span style={labelStyle(activeTab === 'products')}>{t('nav.products')}</span>
      </button>

      <button style={tabStyle(activeTab === 'orders')} onClick={() => onNavigate('/orders')}>
        <div style={{ position: 'relative' }}>
          <ClipboardList size={24} strokeWidth={1.5} />
          {ordersCount > 0 && (
            <span 
              className="animate-pulse-scale"
              style={{
              position: 'absolute',
              top: -6,
              right: -8,
              background: '#EF4444',
              color: 'white',
              fontSize: 10,
              height: 16,
              minWidth: 16,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              fontWeight: 600,
              border: '2px solid #FFFFFF'
            }}>
              {ordersCount > 99 ? '99+' : ordersCount}
            </span>
          )}
        </div>
        <span style={labelStyle(activeTab === 'orders')}>{t('nav.orders')}</span>
      </button>

      <button style={tabStyle(activeTab === 'profile')} onClick={() => onNavigate('/profile')}>
        <User size={24} strokeWidth={1.5} />
        <span style={labelStyle(activeTab === 'profile')}>{t('nav.profile')}</span>
      </button>
    </nav>
  )
}
