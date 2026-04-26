import { useState, useCallback, useMemo } from 'react'
import { useSystemLogs } from '@hooks/system/useSystemLogs'

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

export interface CartItem {
  id: number
  name: string
  code: string | null
  price: number
  quantity: number
  total: number
  unit: string | null
  stock?: number | null
}

interface UseCartOptions {
  checkStock?: boolean
  onStockError?: (message: string) => void
  onAddToCart?: (product: Product) => void
  onRemoveFromCart?: (productId: number) => void
}

interface UseCartReturn {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  addToCart: (product: Product) => void
  updateQuantity: (productId: number, quantity: number) => void
  removeItem: (productId: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: (discount?: number) => number
  cartCount: number
  products?: Product[]
}

export const useCart = (
  products: Product[] = [],
  options: UseCartOptions = {}
): UseCartReturn => {
  const { logAction } = useSystemLogs()
  const { 
    checkStock = false, 
    onStockError,
    onAddToCart,
    onRemoveFromCart 
  } = options

  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCartItemIndex, setSelectedCartItemIndex] = useState<number>(0)

  const addToCart = useCallback((product: Product) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === product.id)
      
      if (existingIndex >= 0) {
        const existing = prevCart[existingIndex]
        const newQuantity = existing.quantity + 1
        
        if (checkStock && product.stock_quantity !== null && newQuantity > product.stock_quantity) {
          onStockError?.(`Estoque insuficiente! Disponível: ${product.stock_quantity}`)
          return prevCart
        }
        
        logAction({ 
          action: 'UPDATE_CART_QUANTITY', 
          entityType: 'cart', 
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
        entityType: 'cart', 
        details: { product_name: product.name } 
      })

      onAddToCart?.(product)
      
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
  }, [checkStock, onStockError, logAction, onAddToCart])

  const updateQuantity = useCallback((productId: number, newQuantity: number) => {
    if (products.length === 0) return
    
    setCart(prevCart => {
      const product = products.find(p => p.id === productId)
      if (!product) return prevCart
      
      if (checkStock && product.stock_quantity !== null && newQuantity > product.stock_quantity) {
        onStockError?.(`Estoque insuficiente! Disponível: ${product.stock_quantity}`)
        return prevCart
      }
      
      if (newQuantity <= 0) {
        onRemoveFromCart?.(productId)
        return prevCart.filter(item => item.id !== productId)
      }
      
      return prevCart.map(item =>
        item.id === productId 
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price } 
          : item
      )
    })
  }, [products, checkStock, onStockError, onRemoveFromCart])

  const removeItem = useCallback((productId: number) => {
    onRemoveFromCart?.(productId)
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }, [onRemoveFromCart])

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

  const cartCount = useMemo(() => cart.length, [cart])

  return {
    cart,
    setCart,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getTotal,
    cartCount,
    products,
    selectedCartItemIndex,
    setSelectedCartItemIndex
  }
}

export default useCart