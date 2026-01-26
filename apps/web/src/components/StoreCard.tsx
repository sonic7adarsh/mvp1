import React from 'react'

export interface Store {
  id: string
  name: string
  type: string // 'grocery', 'restaurant', 'pharmacy', etc.
  status: string // 'open', 'closed', etc.
  orderingDisabled: boolean
  rating?: number
  deliveryTime?: string
  imageUrl?: string
  address?: string
}

interface StoreCardProps {
  store: Store
  onClick: () => void
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, onClick }) => {
  // Strict Status Logic (Single Source)
  const isOpen = store.status === 'open' && !store.orderingDisabled

  // Task 4: Light Theme, Minimal & Premium
  const cardStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    padding: '8px',
    borderRadius: '16px',
    background: '#FFFFFF', // Light Theme Background
    border: '1px solid #E5E7EB', // Light Border
    boxShadow: '0 2px 4px rgba(0,0,0,0.04)', // Subtle shadow
    marginBottom: '0', // Let container handle spacing
    cursor: 'pointer',
    position: 'relative',
    opacity: isOpen ? 1 : 0.6,
    transition: 'transform 0.1s, box-shadow 0.2s',
  }

  const imageContainerStyle: React.CSSProperties = {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    background: '#F3F4F6', // Light gray placeholder
    backgroundImage: store.imageUrl ? `url(${store.imageUrl})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flexShrink: 0,
    marginRight: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    position: 'relative',
    overflow: 'hidden',
  }

  const contentStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', // Center vertically
    flex: 1,
    padding: '2px 0',
  }

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center', // Align center
    marginBottom: '8px',
  }

  const nameStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827', // Primary Text (Black)
    lineHeight: '1.25',
    marginRight: '8px',
    flex: 1,
  }

  const metaRowStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column', // Stack Area under Name
    gap: '4px',
  }

  const areaStyle: React.CSSProperties = {
    fontSize: '13px',
    color: '#6B7280', // Secondary Text (Gray)
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  }

  const statusPillStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    padding: '4px 8px',
    borderRadius: '12px',
    // Open: Green bg, Closed: Gray bg
    background: isOpen ? '#ECFDF5' : '#F3F4F6', 
    color: isOpen ? '#059669' : '#9CA3AF',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    border: isOpen ? '1px solid #D1FAE5' : '1px solid #E5E7EB'
  }

  return (
    <div style={cardStyle} onClick={onClick}>
      <div style={imageContainerStyle}>
        {!store.imageUrl && '🛍️'}
        {!isOpen && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,0.6)', // Light overlay
          }} />
        )}
      </div>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div style={nameStyle}>{store.name}</div>
          <span style={statusPillStyle}>
            {isOpen ? 'OPEN' : 'CLOSED'}
          </span>
        </div>
        <div style={metaRowStyle}>
           <span style={areaStyle}>
             {store.address || 'Local Area'}
           </span>
        </div>
      </div>
    </div>
  )
}
