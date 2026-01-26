import { createContext, useContext, useMemo, useState } from 'react'

export type CartItem = {
  productId: string
  storeId?: string
  name?: string
  price?: number
  quantity: number
  image?: string
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  increment: (productId: string) => void
  decrement: (productId: string) => void
  getQuantity: (productId: string) => number
  clearCart: () => void
  prefillCart: (items: Array<{ productId: string; quantity: number }>) => void
  subtotal: number
  total: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem: CartContextType['addItem'] = (item) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
  }

  const increment: CartContextType['increment'] = (productId) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
      )
    )
  }

  const decrement: CartContextType['decrement'] = (productId) => {
    setItems((prev) => {
      const updated = prev
        .map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0)
      return updated
    })
  }

  const getQuantity: CartContextType['getQuantity'] = (productId) => {
    const found = items.find((i) => i.productId === productId)
    return found ? found.quantity : 0
  }

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.price ?? 0) * i.quantity), 0),
    [items]
  )
  const total = subtotal // Delivery mocked as ₹0

  const clearCart = () => {
    // Clearing cart should also clear any repeat-ordering active flag
    try {
      window.localStorage.removeItem('repeatOrderingActive')
    } catch {}
    setItems([])
  }

  const prefillCart: CartContextType['prefillCart'] = (prefill) => {
    // Replace current cart with minimal items (no price assumptions)
    // Name/price intentionally omitted; shown as placeholders in UI.
    setItems(
      prefill.map((p) => ({ productId: String(p.productId), quantity: Number(p.quantity || 0) || 0 }))
        .filter((i) => i.quantity > 0)
    )
  }

  const value: CartContextType = {
    items,
    addItem,
    increment,
    decrement,
    getQuantity,
    clearCart,
    prefillCart,
    subtotal,
    total,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}