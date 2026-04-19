import { useState, useCallback, useMemo } from 'react'

const useBudgetCart = (products, logAction) => {
  const [cart, setCart] = useState([])
  
  const addToCart = useCallback((product) => {
    // lógica do carrinho
  }, [cart, products])
  
  const updateQuantity = useCallback((productId, quantity) => {
    // ...
  }, [cart, products])
  
  const removeItem = useCallback((productId) => {
    // ...
  }, [])
  
  const clearCart = useCallback(() => {
    setCart([])
  }, [])
  
  const subtotal = useMemo(() => 
    cart.reduce((sum, item) => sum + item.total, 0)
  , [cart])
  
  return { cart, addToCart, updateQuantity, removeItem, clearCart, subtotal }
}

export default useBudgetCart