import React, { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Phone, Keyboard, ShoppingCart, User, Ticket, 
  CreditCard, WifiOff, FileText, Maximize, Minimize, RotateCcw 
} from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import { usePDVRealtime } from '@hooks/usePDVRealtime'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import PageHeader from '@components/ui/PageHeader'
import ConfirmModal from '@components/ui/ConfirmModal'
import QuickCustomerForm from '@components/sales/pdv/QuickCustomerForm'
import CouponSelector from '@components/sales/pdv/CouponSelector'
import CheckoutModal from '@components/sales/pdv/CheckoutModal'
import ShortcutsHelpModal from '@components/ui/ShortcutsHelpModal'
import ProductGrid from '@components/sales/pdv/ProductGrid'
import CartSummary from '@components/sales/pdv/CartSummary'
import CompactCartView from '@components/sales/pdv/CompactCartView'
import SyncStatus from '@components/sales/pdv/SyncStatus'
import ShortcutFeedback from '@components/ui/ShortcutFeedback'

import { useSystemLogs } from '@hooks/useSystemLogs'
import usePDVShortcuts from '@hooks/usePDVShortcuts'
import useKioskMode from '@hooks/useKioskMode'
import { useNetworkStatus } from '@hooks/useNetworkStatus'
import useMediaQuery from '@hooks/useMediaQuery'

import { usePDVCart } from '@hooks/pdv/usePDVCart'
import { usePDVCustomer } from '@hooks/pdv/usePDVCustomer'
import { usePDVCoupon } from '@hooks/pdv/usePDVCoupon'
import { usePDVModals } from '@hooks/pdv/usePDVModals'
import { usePDVFeedback } from '@hooks/pdv/usePDVFeedback'
import { usePDVSearch } from '@hooks/pdv/usePDVSearch'
import { usePDVPayment } from '@hooks/pdv/usePDVPayment'

import { saveSaleOffline } from '@utils/offlineStorage'
import { formatCurrency } from '@utils/formatters'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'
import * as saleService from '@services/saleService'

const Sales = () => {
  const { profile } = useAuth()
  const { logCreate, logError } = useSystemLogs()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const { isKioskMode, toggleKioskMode } = useKioskMode()
  const { isOnline } = useNetworkStatus()
  usePDVRealtime(true)

  const searchInputRef = useRef(null)
  const processingRef = useRef(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // ============= HOOKS PERSONALIZADOS =============
  const {
    feedback,
    shortcutFeedback,
    showFeedback,
    hideFeedback,
    showShortcutFeedback,
    hideShortcutFeedback
  } = usePDVFeedback()

  

  const {
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTotal,
    selectedCartItemIndex,
    setSelectedCartItemIndex,
    cartCount
  } = usePDVCart([], showFeedback)

  const {
    customer,
    customerPhone,
    quickCustomerForm,
    quickCustomerErrors,
    setCustomerPhone,
    setQuickCustomerForm,
    setQuickCustomerErrors,
    searchCustomer,
    quickRegisterCustomer,
    clearCustomer,
    isSearching,
    isCreating
  } = usePDVCustomer(showFeedback)

  const {
    coupon,
    couponCode,
    couponError,
    discount,
    availableCoupons,
    setCouponCode,
    setCouponError,
    applyCoupon,
    removeCoupon,
    isValidating
  } = usePDVCoupon(customer, cart, showFeedback)

  const {
    paymentMethod,
    setPaymentMethod,
    isPix
  } = usePDVPayment()

  const {
    showCustomerModal,
    showQuickCustomerModal,
    showCouponModal,
    showPaymentModal,
    showShortcutsHelp,
    showClearCartConfirm,
    isAnyModalOpen,
    setShowQuickCustomerModal,
    setShowCouponModal,   
    openCustomerModal,
    openPaymentModal,          
    closeCustomerModal,
    closeCouponModal,
    closePaymentModal,
    openShortcutsHelp,
    closeShortcutsHelp,
    openClearCartConfirm,
    closeClearCartConfirm
  } = usePDVModals()

  // ============= QUERIES =============
  const { 
    data: products = [], 
    isLoading,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ['products-active'],
    queryFn: saleService.fetchProducts,
    staleTime: 0, 
    gcTime: 0,
    refetchOnMount: true,
  })

  const {
    searchTerm,
    selectedCategory,
    categories,
    filteredProducts,
    setSearchTerm,
    setSelectedCategory,
    updateCategories,
    clearSearch
  } = usePDVSearch(products)

  // ============= MUTATIONS =============
  const createSaleMutation = useMutation({
    mutationFn: ({ cart, customer, coupon, discount, paymentMethod }) => 
      saleService.createSale(cart, customer, coupon, discount, paymentMethod, profile),
    onSuccess: async (sale) => {
      await logCreate('sale', sale.id, { 
        sale_number: sale.sale_number, 
        total_amount: sale.total_amount, 
        discount: sale.discount_amount, 
        final_amount: sale.final_amount,
        mode: 'online'
      })
      
      queryClient.invalidateQueries({ queryKey: ['products-active'] })
      showFeedback('success', `Venda finalizada! Nº: ${sale.sale_number}`)
      
      clearCart()
      clearCustomer()
      removeCoupon()
      closePaymentModal()
    },
    onError: async (error) => {
      logger.error('Erro ao finalizar venda:', error)
      
      if (!isOnline || error.message?.includes('network') || error.message?.includes('fetch')) {
        await handleOfflineSale()
      } else {
        showFeedback('error', 'Erro ao finalizar venda: ' + error.message)
        await logError('sale', error, { action: 'create_sale' })
      }
    }
  })

  // ============= HANDLERS =============
  const handleOfflineSale = async () => {
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
      
      showFeedback('success', `✅ Venda salva OFFLINE!`)
      
      clearCart()
      clearCustomer()
      removeCoupon()
      closePaymentModal()
      
    } catch (error) {
      logger.error('❌ Erro ao salvar offline:', error)
      showFeedback('error', 'Erro ao salvar venda offline: ' + error.message)
    }
  }

  const updateLocalStock = (cartItems) => {
    queryClient.setQueryData(['products-active'], (oldData) => {
      if (!oldData) return oldData
      return oldData.map(product => {
        const cartItem = cartItems.find(item => item.id === product.id)
        if (cartItem) {
          return { ...product, stock_quantity: product.stock_quantity - cartItem.quantity }
        }
        return product
      })
    })
  }

  const handleClearCart = () => {
    if (cartCount === 0) return
    openClearCartConfirm()
  }

  const confirmClearCart = () => {
    clearCart()
    closeClearCartConfirm()
    showFeedback('info', 'Carrinho limpo')
  }

  const handleSearchCustomer = async () => {
    const result = await searchCustomer()
    closeCustomerModal()
    
    if (!result?.found) {
      setShowQuickCustomerModal(true)
    }
  }

  const handleApplyCoupon = () => {
    applyCoupon()
    closeCouponModal()
  }

  const createPendingSale = async (callback) => {
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
  }

  const confirmPayment = (method = null) => {
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
  }

  // ============= ATALHOS =============
  const handleFocusSearch = useCallback(() => searchInputRef.current?.focus(), [])
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

  const { shortcuts } = usePDVShortcuts({
    onFocusSearch: handleFocusSearch,
    onClearSearch: clearSearch,
    onRefreshProducts: handleRefreshProducts,
    onClearCart: handleClearCart,
    onIncreaseQuantity: handleIncreaseQuantity,
    onDecreaseQuantity: handleDecreaseQuantity,
    onRemoveItem: removeFromCart,
    onOpenCustomerModal: openCustomerModal,
    onClearCustomer: clearCustomer,
    onOpenCouponModal: () => {
      if (customer) setCouponError('')
      else showFeedback('warning', 'Identifique um cliente primeiro')
    },
    onRemoveCoupon: removeCoupon,
    onOpenPaymentModal: () => {
      if (cartCount === 0) showFeedback('warning', 'Adicione itens ao carrinho')
      else closePaymentModal() // O modal é aberto pelo botão
    },
    onOpenHelp: openShortcutsHelp,
    cartItems: cart,
    selectedCartItemIndex,
    setSelectedCartItemIndex,
    onShortcutFeedback: showShortcutFeedback,
    enabled: !isAnyModalOpen
  })

  // ============= EFEITOS =============
  useEffect(() => {
    updateCategories(products)
  }, [products, updateCategories])

  useEffect(() => {
    if (cartCount === 0) {
      setSelectedCartItemIndex(0)
    } else if (selectedCartItemIndex >= cartCount) {
      setSelectedCartItemIndex(cartCount - 1)
    }
  }, [cartCount, selectedCartItemIndex, setSelectedCartItemIndex])

  // ============= RENDER =============
  const subtotal = getSubtotal()
  const total = getTotal(discount)
  const isMutating = isSearching || isCreating || isValidating || createSaleMutation.isPending

  const headerActions = [
    {
      label: 'Orçamentos',
      icon: FileText,
      onClick: () => navigate('/budgets'),
      variant: 'outline'
    },
    {
      label: 'Atalhos',
      icon: Keyboard,
      onClick: openShortcutsHelp,
      variant: 'outline'
    }
  ]

  if (isLoading) return <DataLoadingSkeleton />

  return (
    <div className={`min-h-screen bg-gray-100 dark:bg-black ${isKioskMode ? 'kiosk-mode' : ''}`}>
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-1.5 px-3 text-center text-xs font-medium shadow-md">
          <div className="flex items-center justify-center gap-2">
            <WifiOff size={14} />
            <span>MODO OFFLINE - Vendas salvas localmente</span>
          </div>
        </div>
      )}
      
      <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 ${!isOnline ? 'pt-10' : ''}`}>
        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={hideFeedback} 
          />
        )}
        
        {shortcutFeedback && (
          <ShortcutFeedback 
            shortcut={shortcutFeedback} 
            onHide={hideShortcutFeedback} 
          />
        )}

        <PageHeader
          title="Ponto de Venda (PDV)"
          description="Realize vendas rapidamente com atalhos de teclado"
          icon={ShoppingCart}
          actions={headerActions}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <ProductGrid 
              products={filteredProducts} 
              searchTerm={searchTerm} 
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory} 
              setSelectedCategory={setSelectedCategory}
              categories={categories} 
              onAddToCart={addToCart} 
              searchInputRef={searchInputRef} 
            />
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 lg:sticky lg:top-4">
              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingCart size={18} className="text-gray-600 dark:text-gray-400" />
                    <span>Carrinho</span>
                    {cartCount > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {cartCount} {cartCount === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </h2>
                  
                  <div className="flex items-center gap-1">
                    {!isMobile && (
                      <button
                        onClick={toggleKioskMode}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        title={isKioskMode ? 'Sair do modo quiosque' : 'Modo quiosque'}
                      >
                        {isKioskMode ? <Minimize size={16} /> : <Maximize size={16} />}
                      </button>
                    )}
                    
                    {cartCount > 0 && (
                      <button
                        onClick={handleClearCart}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Limpar carrinho"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</span>
                  </div>
                  {customer ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-[120px]">
                        {customer.name}
                      </span>
                      <button 
                        onClick={clearCustomer} 
                        className="text-xs text-red-500 hover:text-red-700"
                        disabled={isMutating}
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={openCustomerModal} 
                      disabled={isMutating}
                    >
                      Identificar
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket size={16} className="text-gray-400 dark:text-gray-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cupom</span>
                  </div>
                  {coupon ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {coupon.code}
                      </span>
                      <button 
                        onClick={removeCoupon} 
                        className="text-xs text-red-500 hover:text-red-700"
                        disabled={isMutating}
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowCouponModal(true)} 
                      disabled={!customer || isMutating}
                    >
                      Aplicar
                    </Button>
                  )}
                </div>
              </div>

              <CartSummary 
                cart={cart} 
                discount={discount} 
                products={products} 
                onUpdateQuantity={updateCartItemQuantity}
                onRemoveItem={removeFromCart} 
                onClearCart={handleClearCart} 
                onCheckout={openPaymentModal}
                selectedItemIndex={selectedCartItemIndex} 
                onSelectItem={setSelectedCartItemIndex} 
                disabled={isMutating} 
              />

              <div className="p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium dark:text-white">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Desconto</span>
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="dark:text-white">Total</span>
                    <span className="text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
                  </div>
                </div>
                <Button 
                  type="button"
                  variant="success" 
                  size="lg" 
                  fullWidth 
                  onClick={() => setShowCouponModal(true)}
                  disabled={cartCount === 0 || isMutating} 
                  icon={CreditCard} 
                >
                  {!isOnline ? 'Salvar Venda Offline' : 'Finalizar Venda'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <SyncStatus />
        
        {isMobile && (
          <CompactCartView
            cart={cart}
            total={total}
            subtotal={subtotal}
            discount={discount}
            products={products}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={handleClearCart}
            onCheckout={openPaymentModal}
            disabled={isMutating}
          />
        )}

        {/* Modais */}
        <Modal 
          isOpen={showCustomerModal} 
          onClose={closeCustomerModal} 
          title="Identificar Cliente" 
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                Digite o telefone do cliente
              </p>
            </div>
            <input 
              type="tel" 
              placeholder="(11) 99999-9999" 
              value={customerPhone} 
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg text-center dark:bg-gray-800 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleSearchCustomer()} 
              autoFocus 
              disabled={isSearching} 
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={closeCustomerModal} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleSearchCustomer} loading={isSearching} className="flex-1">
                Buscar
              </Button>
            </div>
          </div>
        </Modal>

        <QuickCustomerForm 
          isOpen={showQuickCustomerModal} 
          onClose={() => setShowQuickCustomerModal(false)}
          formData={quickCustomerForm} 
          setFormData={setQuickCustomerForm} 
          errors={quickCustomerErrors}
          onSubmit={quickRegisterCustomer} 
          isSubmitting={isCreating} 
        />

        <CouponSelector 
          isOpen={showCouponModal} 
          onClose={closeCouponModal} 
          customer={customer} 
          coupon={coupon}
          availableCoupons={availableCoupons} 
          couponCode={couponCode} 
          setCouponCode={setCouponCode} 
          couponError={couponError}
          onApplyCoupon={handleApplyCoupon} 
          onRemoveCoupon={removeCoupon} 
          isLoading={isValidating} 
        />

        <CheckoutModal 
          isOpen={showPaymentModal} 
          onClose={closePaymentModal} 
          cart={cart} 
          discount={discount}
          subtotal={subtotal} 
          total={total} 
          customer={customer} 
          paymentMethod={paymentMethod} 
          setPaymentMethod={setPaymentMethod}
          onConfirm={confirmPayment} 
          isSubmitting={createSaleMutation.isPending} 
          isOnline={isOnline} 
          onCreatePendingSale={createPendingSale} 
        />

        <ConfirmModal 
          isOpen={showClearCartConfirm} 
          onClose={closeClearCartConfirm} 
          onConfirm={confirmClearCart}
          title="Limpar Carrinho" 
          message="Tem certeza que deseja remover todos os itens?"
          confirmText="Limpar" 
          cancelText="Cancelar" 
          variant="danger" 
        />

        <ShortcutsHelpModal 
          isOpen={showShortcutsHelp} 
          onClose={closeShortcutsHelp} 
          shortcuts={shortcuts} 
        />
      </div>
    </div>
  )
}

export default Sales