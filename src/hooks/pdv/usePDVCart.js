import { useState, useCallback } from 'react'
import { useSystemLogs } from '@hooks/useSystemLogs'

export const usePDVCart = (products, showFeedback) => {
  const { logAction } = useSystemLogs()
  const [cart, setCart] = useState([])
  const [selectedCartItemIndex, setSelectedCartItemIndex] = useState(0)

  const addToCart = useCallback((product) => {
    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.id === product.id)
      
      if (existingIndex >= 0) {
        const existing = prevCart[existingIndex]
        const newQuantity = existing.quantity + 1
        
        // Validação de estoque
        if (newQuantity > product.stock_quantity) {
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
          total: newQuantity * existing.price
        }
        return updatedCart
      }
      
      // Adiciona novo item
      logAction({ 
        action: 'ADD_TO_CART', 
        entityType: 'sale', 
        details: { product_name: product.name } 
      })
      
      return [...prevCart, {
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.price,
        quantity: 1,
        total: product.price,
        unit: product.unit,
        stock: product.stock_quantity
      }]
    })
  }, [showFeedback, logAction])

  const updateCartItemQuantity = useCallback((productId, newQuantity) => {
    setCart(prevCart => {
      const product = products.find(p => p.id === productId)
      if (!product) return prevCart
      
      // Validação de estoque
      if (newQuantity > product.stock_quantity) {
        showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
        return prevCart
      }
      
      // Remove se quantidade <= 0
      if (newQuantity <= 0) {
        return prevCart.filter(item => item.id !== productId)
      }
      
      // Atualiza quantidade
      return prevCart.map(item =>
        item.id === productId 
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price } 
          : item
      )
    })
  }, [products, showFeedback])

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    setSelectedCartItemIndex(0)
  }, [])

  const getSubtotal = useCallback(() => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }, [cart])

  const getTotal = useCallback((discount = 0) => {
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