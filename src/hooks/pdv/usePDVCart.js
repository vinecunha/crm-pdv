// src/hooks/pdv/usePDVCart.js
import { useState, useCallback } from 'react'
import { useSystemLogs } from '@hooks/useSystemLogs'

export const usePDVCart = (products, showFeedback) => {
  const { logAction } = useSystemLogs()
  const [cart, setCart] = useState([])
  const [selectedCartItemIndex, setSelectedCartItemIndex] = useState(0)

  const addToCart = useCallback((product) => {
    const existing = cart.find(item => item.id === product.id)
    
    if (existing) {
      updateCartItemQuantity(product.id, existing.quantity + 1)
    } else {
      setCart(prev => [...prev, {
        id: product.id,
        name: product.name,
        code: product.code,
        price: product.price,
        quantity: 1,
        total: product.price,
        unit: product.unit,
        stock: product.stock_quantity
      }])
      logAction({ 
        action: 'ADD_TO_CART', 
        entityType: 'sale', 
        details: { product_name: product.name } 
      })
    }
  }, [cart, products])

  const updateCartItemQuantity = useCallback((productId, newQuantity) => {
    const product = products.find(p => p.id === productId)
    if (!product) return
    
    if (newQuantity > product.stock_quantity) {
      showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
      return
    }
    
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }
    
    setCart(prev => prev.map(item =>
      item.id === productId 
        ? { ...item, quantity: newQuantity, total: newQuantity * item.price } 
        : item
    ))
  }, [products])

  const removeFromCart = useCallback((productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
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