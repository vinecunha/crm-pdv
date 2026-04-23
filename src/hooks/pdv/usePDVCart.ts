import { useState, useCallback } from 'react'
import { useSystemLogs } from '@hooks/system/useSystemLogs'

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
  stock: number | null
}

type FeedbackType = 'success' | 'error' | 'info' | 'warning'
type ShowFeedback = (type: FeedbackType, message: string) => void

interface UsePDVCartReturn {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  addToCart: (product: Product) => void
  updateCartItemQuantity: (productId: number, newQuantity: number) => void
  removeFromCart: (productId: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: (discount?: number) => number
  selectedCartItemIndex: number
  setSelectedCartItemIndex: React.Dispatch<React.SetStateAction<number>>
  cartCount: number
}

export const usePDVCart = (
  products: Product[],
  showFeedback: ShowFeedback
): UsePDVCartReturn => {
  const { logAction } = useSystemLogs()
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCartItemIndex, setSelectedCartItemIndex] = useState<number>(0)

  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === product.id)
      
      if (existingIndex >= 0) {
        const existing = prevCart[existingIndex]
        const newQuantity = existing.quantity + 1
        
        if (product.stock_quantity !== null && newQuantity > product.stock_quantity) {
          showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
          return prevCart
        }
        
        logAction({ 
          action: 'UPDATE_CART_QUANTITY', 
          entityType: 'sale', 
          details: { product_name: product.name, quantity: newQuantity } 
        })
        
        const updatedCart = [...prevCart]
        updatedCart[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          total: newQuantity * (existing.price || 0)
        }
        return updatedCart
      }
      
      logAction({ 
        action: 'ADD_TO_CART', 
        entityType: 'sale', 
        details: { product_name: product.name } 
      })
      
      return [...prevCart, {
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.price || 0,
        quantity: 1,
        total: product.price || 0,
        unit: product.unit,
        stock: product.stock_quantity
      }]
    })
  }, [showFeedback, logAction])

  const updateCartItemQuantity = useCallback((productId: number, newQuantity: number) => {
    setCart(prevCart => {
      const product = products.find(p => p.id === productId)
      if (!product) return prevCart
      
      if (product.stock_quantity !== null && newQuantity > product.stock_quantity) {
        showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
        return prevCart
      }
      
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId)
      }
      
      return prevCart.map(item =>
        item.id === productId 
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price } 
          : item
      )
    })
  }, [products, showFeedback])

  const removeFromCart = useCallback((productId: number) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setSelectedCartItemIndex(0)
  }, [])

  const getSubtotal = useCallback((): number => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }, [cart])

  const getTotal = useCallback((discount: number = 0): number => {
    return getSubtotal() - discount
  }, [getSubtotal])

  return {
    cart,
    setCart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTotal,
    selectedCartItemIndex,
    setSelectedCartItemIndex,
    cartCount: cart.length
  }
}