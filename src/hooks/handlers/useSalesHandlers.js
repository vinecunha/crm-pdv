// src/hooks/handlers/useSalesHandlers.js
import { useCallback } from 'react'

export const useSalesHandlers = ({
  profile,
  cart,
  cartCount,
  customer,
  coupon,
  discount,
  paymentMethod,
  products,
  getSubtotal,
  getTotal,
  clearCart,
  clearCustomer,
  removeCoupon,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  searchCustomer,
  applyCoupon,
  setCouponError,
  setCustomerPhone,
  setQuickCustomerForm,
  quickRegisterCustomer,
  setShowQuickCustomerModal,
  setShowCouponModal,
  openCustomerModal,
  closeCustomerModal,
  openPaymentModal,
  closePaymentModal,
  openClearCartConfirm,
  closeClearCartConfirm,
  openShortcutsHelp,
  closeShortcutsHelp,
  openReceiptModal,
  closeReceiptModal,
  showFeedback,
  refetchProducts,
  updateCategories,
  setSelectedCartItemIndex,
  isOnline,
  isProcessingPayment,
  setIsProcessingPayment,
  processingRef,
  createSaleMutation,
  saveSaleOffline,
  updateLocalStock,
  logCreate,
  logError,
  setCompletedSaleData,
  queryClient,
  supabase,
  logger
}) => {

  const handleOfflineSale = useCallback(async () => {
    try {
      const subtotal = getSubtotal()
      const total = getTotal(discount)
      
      const offlineSaleData = {
        customer_id: customer?.id || null,
        customer_name: customer?.name || 'Cliente offline',
        customer_phone: customer?.phone || null,
        total_amount: subtotal,
        discount_amount: discount,
        coupon_code: coupon?.code || null,
        final_amount: total,
        payment_method: paymentMethod,
        created_by: profile?.id,
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_code: item.code,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total
        })),
        offlineCreated: true,
        offlineCreatedAt: new Date().toISOString(),
      }
      
      await saveSaleOffline(offlineSaleData)
      updateLocalStock(cart)
      
      await logCreate('sale', `offline-${Date.now()}`, { 
        offline: true, total_amount: subtotal, discount, final_amount: total 
      })
      
      const offlineSale = {
        sale_number: `OFF-${Date.now()}`,
        total_amount: subtotal,
        discount_amount: discount,
        final_amount: total
      }
      
      setCompletedSaleData({
        sale: offlineSale,
        cart: [...cart],
        customer: customer ? { ...customer } : null,
        paymentMethod: paymentMethod,
        discount: discount
      })
      
      showFeedback('success', '✅ Venda salva OFFLINE!')
      
      clearCart()
      clearCustomer()
      removeCoupon()
      closePaymentModal()
      openReceiptModal()
      
    } catch (error) {
      logger.error('❌ Erro ao salvar offline:', error)
      showFeedback('error', 'Erro ao salvar venda offline: ' + error.message)
    }
  }, [cart, customer, coupon, discount, paymentMethod, profile, getSubtotal, getTotal, saveSaleOffline, updateLocalStock, logCreate, setCompletedSaleData, showFeedback, clearCart, clearCustomer, removeCoupon, closePaymentModal, openReceiptModal, logger])

  const handleClearCart = useCallback(() => {
    if (cartCount === 0) return
    openClearCartConfirm()
  }, [cartCount, openClearCartConfirm])

  const confirmClearCart = useCallback(() => {
    clearCart()
    closeClearCartConfirm()
    showFeedback('info', 'Carrinho limpo')
  }, [clearCart, closeClearCartConfirm, showFeedback])

  const handleSearchCustomer = useCallback(async () => {
    const result = await searchCustomer()
    closeCustomerModal()
    
    if (!result?.found) {
      setShowQuickCustomerModal(true)
    }
  }, [searchCustomer, closeCustomerModal, setShowQuickCustomerModal])

  const handleApplyCoupon = useCallback(() => {
    applyCoupon()
    closeCouponModal()
  }, [applyCoupon, closeCouponModal])

  const createPendingSale = useCallback(async (callback) => {
    if (processingRef.current) {
      logger.warn('⚠️ Já existe um processamento em andamento')
      return
    }
    
    processingRef.current = true
    setIsProcessingPayment(true)
    
    try {
      const invalidProducts = cart.filter(item => {
        const product = products.find(p => p.id === item.id)
        return !product || !product.is_active || product.deleted_at
      })
      
      if (invalidProducts.length > 0) {
        const names = invalidProducts.map(p => p.name).join(', ')
        throw new Error(`Produtos inválidos no carrinho: ${names}`)
      }

      const subtotal = getSubtotal()
      const total = getTotal(discount)
      
      const itemsJson = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_code: item.code,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total
      }))
      
      const idempotencyKey = crypto.randomUUID?.() || Date.now().toString()
      
      const { data, error } = await supabase.rpc('create_pending_sale', {
        p_customer_id: customer?.id || null,
        p_customer_name: customer?.name || 'Cliente não identificado',
        p_customer_phone: customer?.phone || null,
        p_total_amount: subtotal,
        p_discount_amount: discount,
        p_coupon_code: coupon?.code || null,
        p_final_amount: total,
        p_payment_method: 'pix',
        p_created_by: profile?.id,
        p_items: itemsJson,
        p_idempotency_key: idempotencyKey
      })
      
      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Erro ao processar venda')
      
      closePaymentModal()
      
      if (callback) callback(data.sale_id)
      
    } catch (error) {
      logger.error('❌ Erro ao criar venda pendente:', error)
      showFeedback('error', 'Erro: ' + error.message)
    } finally {
      setTimeout(() => {
        processingRef.current = false
        setIsProcessingPayment(false)
      }, 2000)
    }
  }, [cart, products, customer, coupon, discount, profile, getSubtotal, getTotal, supabase, closePaymentModal, logger, showFeedback, setIsProcessingPayment, processingRef])

  const confirmPayment = useCallback((method = null) => {
    if (processingRef.current || isProcessingPayment) {
      logger.warn('⚠️ Pagamento já em processamento')
      return
    }
    
    const finalPaymentMethod = method || paymentMethod
    
    if (finalPaymentMethod === 'pix') return
    
    if (!isOnline) {
      handleOfflineSale()
      return
    }
    
    createSaleMutation.mutate({ 
      cart, 
      customer, 
      coupon, 
      discount, 
      paymentMethod: finalPaymentMethod 
    })
  }, [processingRef, isProcessingPayment, paymentMethod, isOnline, cart, customer, coupon, discount, createSaleMutation, handleOfflineSale, logger])

  const handleRefreshProducts = useCallback(async () => {
    await refetchProducts()
    showFeedback('info', 'Produtos atualizados')
  }, [refetchProducts, showFeedback])

  const handleIncreaseQuantity = useCallback((item) => 
    updateCartItemQuantity(item.id, item.quantity + 1), 
    [updateCartItemQuantity]
  )
  
  const handleDecreaseQuantity = useCallback((item) => 
    updateCartItemQuantity(item.id, item.quantity - 1), 
    [updateCartItemQuantity]
  )

  return {
    handleOfflineSale,
    handleClearCart,
    confirmClearCart,
    handleSearchCustomer,
    handleApplyCoupon,
    createPendingSale,
    confirmPayment,
    handleRefreshProducts,
    handleIncreaseQuantity,
    handleDecreaseQuantity
  }
}