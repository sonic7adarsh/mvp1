import React from 'react'
import { useCart } from '../CartContext'
import { useTranslation } from 'react-i18next'

export type ProductCardProps = {
  product: {
    id: string
    name: string
    price: number
    image?: string
    unit: string
    storeId?: string
  }
  onClick?: () => void
  onConflict?: (product: any) => void
}

export function ProductCard({ product, onClick, onConflict }: ProductCardProps) {
  const { t } = useTranslation()
  const { addItem, getQuantity, increment, decrement, items } = useCart()
  const qty = getQuantity(product.id)

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    padding: 12,
    background: '#FFFFFF',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    marginBottom: 12,
    cursor: onClick ? 'pointer' : 'default',
  }

  const imageStyle: React.CSSProperties = {
    width: '64px',
    height: '64px',
    borderRadius: '8px',
    backgroundColor: '#F3F4F6',
    backgroundImage: product.image ? `url(${product.image})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: '#9CA3AF'
  }

  const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  }

  const nameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#111111',
    marginBottom: 4,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  const priceStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#D32F2F',
    marginBottom: 4,
  }

  const unitStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#6B7280',
  }

  const addBtnStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: 8,
    background: '#D32F2F',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    alignSelf: 'flex-start',
  }

  const qtyControlStyle: React.CSSProperties = {
    display: 'flex',
    gap: 8,
    alignSelf: 'flex-start',
  }

  const qtyBtnStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: 8,
    background: '#F3F4F6',
    color: '#111111',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  }

  const qtyValStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 600,
  }

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Check for store conflict
    const currentStoreId = product.storeId
    const existingStoreId = items.length > 0 ? items[0].storeId : null

    // If cart has items, and we are adding from a specific store
    // Trigger conflict if:
    // 1. Existing cart belongs to a different store
    // 2. Existing cart has NO store (legacy/broken items)
    if (currentStoreId && items.length > 0 && existingStoreId !== currentStoreId) {
      if (onConflict) {
        onConflict(product)
        return
      }
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      storeId: product.storeId,
      quantity: 1
    })
  }

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    increment(product.id)
  }

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation()
    decrement(product.id)
  }

  return (
    <div style={cardStyle} onClick={onClick}>
      <div style={imageStyle}>
        {!product.image && '🖼️'}
      </div>
      <div style={contentStyle}>
        <div>
          <div style={nameStyle}>{product.name}</div>
          <div style={priceStyle}>₹{product.price.toFixed(2)}</div>
          <div style={unitStyle}>/ {product.unit}</div>
        </div>
        {qty === 0 ? (
          <button style={addBtnStyle} onClick={handleAdd}>{t('store.add_btn')}</button>
        ) : (
          <div style={qtyControlStyle}>
            <button style={qtyBtnStyle} onClick={handleDecrement}>-</button>
            <div style={qtyValStyle}>{qty}</div>
            <button style={qtyBtnStyle} onClick={handleIncrement}>+</button>
          </div>
        )}
      </div>
    </div>
  )
}
