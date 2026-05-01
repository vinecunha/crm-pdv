import { useState, useCallback } from 'react'

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  total: number
  unit: string
}

interface UsePDVCartReturn {
  cart: CartItem[]
  cartCount: number
  addToCart: (product: { id: number; name: string; price: number; stock_quantity: number; unit: string }) => void
  updateCartItemQuantity: (productId: number, quantity: number) => void
  removeFromCart: (productId: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: (discount: number) => number
}

export const usePDVCart = (
  products: Array<{ id: number; stock_quantity: number }>,
  showFeedback: (type: string, message: string) => void
): UsePDVCartReturn => {
  const [cart, setCart] = useState<CartItem[]>([])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const addToCart = useCallback((product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id)
      if (existing) {
        const newQty = existing.quantity + 1
        if (newQty > product.stock_quantity) {
          showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
          return prev
        }
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQty, total: newQty * item.price }
            : item
        )
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        total: product.price,
        unit: product.unit
      }]
    })
  }, [showFeedback])

  const updateCartItemQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== productId))
      return
    }
    setCart(prev =>
      prev.map(item => {
        if (item.id !== productId) return item
        const product = products.find(p => p.id === productId)
        if (product && quantity > product.stock_quantity) {
          showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
          return item
        }
        return { ...item, quantity, total: quantity * item.price }
      })
    )
  }, [products, showFeedback])

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const getSubtotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }, [cart])

  const getTotal = useCallback((discount: number) => {
    return Math.max(0, getSubtotal() - discount)
  }, [getSubtotal])

  return {
    cart,
    cartCount,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTotal
  }
}
