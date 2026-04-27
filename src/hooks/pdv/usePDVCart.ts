import { useState, useCallback, useMemo } from 'react'
import type { Product, CartItem } from '@/types'

type FeedbackType = 'success' | 'error' | 'info' | 'warning'
type ShowFeedback = (type: FeedbackType, message: string) => void

interface UsePDVCartReturn {
  cart: CartItem[]
  cartCount: number
  addToCart: (product: Product) => void
  updateCartItemQuantity: (id: number, quantity: number) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: (discount?: number) => number
}

export const usePDVCart = (
  products: Product[],
  showFeedback: ShowFeedback
): UsePDVCartReturn => {
  const [cart, setCart] = useState<CartItem[]>([])

  const cartCount = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  )

  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id)
      
      if (existingItem) {
        return prevCart.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
            : item
        )
      }
      
      return [
        ...prevCart,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          total: product.price,
          unit: product.unit
        }
      ]
    })
  }, [])

  const updateCartItemQuantity = useCallback((id: number, quantity: number) => {
    const product = products.find(p => p.id === id)
    
    if (quantity > 0 && product && quantity > product.stock_quantity) {
      showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
      return
    }

    if (quantity === 0) {
      setCart(prevCart => prevCart.filter(item => item.id !== id))
      return
    }

    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id 
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    )
  }, [products, showFeedback])

  const removeFromCart = useCallback((id: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
  }, [])

  const getSubtotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }, [cart])

  const getTotal = useCallback((discount: number = 0) => {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    return subtotal - discount
  }, [cart])

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