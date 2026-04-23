import { useState, useCallback, useMemo } from 'react'

// Baseado em: public.products
interface Product {
  id: number
  code: string | null
  name: string
  price: number | null
  stock_quantity: number | null
  unit: string | null
  is_active: boolean | null
  [key: string]: unknown
}

interface CartItem {
  id: number
  name: string
  code: string | null
  price: number
  quantity: number
  total: number
  unit: string | null
  [key: string]: unknown
}

interface LogActionParams {
  action: string
  entityType: string
  details?: Record<string, unknown>
}

interface UseBudgetCartReturn {
  cart: CartItem[]
  addToCart: (product: Product) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  subtotal: number
}

export const useBudgetCart = (
  products: Product[],
  logAction?: (params: LogActionParams) => void
): UseBudgetCartReturn => {
  const [cart, setCart] = useState<CartItem[]>([])
  
  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === product.id)
      
      if (existingIndex >= 0) {
        const updatedCart = [...prevCart]
        const existing = updatedCart[existingIndex]
        const newQuantity = existing.quantity + 1
        
        updatedCart[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          total: newQuantity * (existing.price || 0)
        }
        
        logAction?.({ 
          action: 'UPDATE_CART_QUANTITY', 
          entityType: 'budget',
          details: { product_name: product.name, quantity: newQuantity }
        })
        
        return updatedCart
      }
      
      logAction?.({ 
        action: 'ADD_TO_CART', 
        entityType: 'budget',
        details: { product_name: product.name }
      })
      
      return [...prevCart, {
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.price || 0,
        quantity: 1,
        total: product.price || 0,
        unit: product.unit
      }]
    })
  }, [logAction])
  
  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setCart(prevCart => {
      if (quantity <= 0) {
        return prevCart.filter(item => item.id !== productId)
      }
      
      return prevCart.map(item =>
        item.id === productId 
          ? { ...item, quantity, total: quantity * item.price } 
          : item
      )
    })
  }, [])
  
  const removeItem = useCallback((productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }, [])
  
  const clearCart = useCallback(() => {
    setCart([])
  }, [])
  
  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.total, 0)
  , [cart])
  
  return { 
    cart, 
    addToCart, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    subtotal 
  }
}