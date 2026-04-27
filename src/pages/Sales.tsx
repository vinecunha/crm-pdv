import React, { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Keyboard, ShoppingCart, User, Ticket, 
  CreditCard, WifiOff, FileText, Maximize, Minimize, RotateCcw 
} from '@lib/icons'
import { usePDVSales } from '@hooks/pdv/usePDVSales'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import { useNetworkStatus } from '@/hooks/utils/useNetworkStatus'
import useMediaQuery from '@/hooks/utils/useMediaQuery'

import FeedbackMessage from '@components/ui/FeedbackMessage'
import Button from '@components/ui/Button'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import PageHeader from '@components/ui/PageHeader'
import ProductGrid from '@components/sales/pdv/ProductGrid'
import CartSummary from '@components/sales/pdv/CartSummary'
import CompactCartView from '@components/sales/pdv/CompactCartView'
import SyncStatus from '@components/sales/pdv/SyncStatus'
import ShortcutFeedback from '@components/ui/ShortcutFeedback'
import SalesModalsContainer from '@components/sales/pdv/SalesModalsContainer'

import useKioskMode from '@hooks/utils/useKioskMode'
import { formatCurrency } from '@utils/formatters'

const Sales = () => {
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 1024px)')
  const { isKioskMode, toggleKioskMode } = useKioskMode()
  const { logCreate, logError } = useSystemLogs()
  const { isOnline } = useNetworkStatus()

  const searchInputRef = React.useRef(null)

  const {
    feedback,
    shortcutFeedback,
    showFeedback,
    hideFeedback,
    showShortcutFeedback,
    hideShortcutFeedback,
    products,
    isLoading,
    refetchProducts,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
    getTotal,
    cartCount,
    selectedCartItemIndex,
    setSelectedCartItemIndex,
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
    isCreating,
    coupon,
    couponCode,
    couponError,
    discount,
    availableCoupons,
    setCouponCode,
    setCouponError,
    applyCoupon,
    removeCoupon,
    isValidating,
    paymentMethod,
    setPaymentMethod,
    isPix,
    showCustomerModal,
    showQuickCustomerModal,
    showCouponModal,
    showPaymentModal,
    showShortcutsHelp,
    showClearCartConfirm,
    isAnyModalOpen,
    showReceiptModal,
    setShowReceiptModal,
    setShowQuickCustomerModal,
    setShowCouponModal,
    openCustomerModal,
    closeCustomerModal,
    openCouponModal,
    closeCouponModal,
    openPaymentModal,
    closePaymentModal,
    openClearCartConfirm,
    closeClearCartConfirm,
    openReceiptModal,
    closeReceiptModal,
    openShortcutsHelp,
    closeShortcutsHelp,
    searchTerm,
    selectedCategory,
    categories,
    filteredProducts,
    setSearchTerm,
    setSelectedCategory,
    clearSearch,
    isProcessingPayment,
    completedSaleData,
    handlers,
    createSaleMutation,
    updateLocalStock
  } = usePDVSales({
    onSaleCreated: (sale) => {
      logCreate('sale', sale.id.toString(), { sale_number: sale.sale_number })
    },
    onSaleError: (error) => {
      logError('sale', error.message)
    }
  })

  const handleSearchSubmit = useCallback(() => {
    if (!searchTerm.trim()) return
    
    const code = searchTerm.trim().toUpperCase()
    const product = products.find(p => p.code?.toUpperCase() === code || p.id.toString() === code)
    
    if (product) {
      addToCart(product)
      setSearchTerm('')
      searchInputRef.current?.focus()
    } else {
      showFeedback('error', 'Produto não encontrado')
    }
  }, [searchTerm, products, addToCart, setSearchTerm, showFeedback])

  const handleSearchSubmitMobile = useCallback(() => {
    const code = searchTerm.trim().toUpperCase()
    const product = filteredProducts.find(p => p.code?.toUpperCase() === code || p.id.toString() === code)
    
    if (product) {
      addToCart(product)
      setSearchTerm('')
      searchInputRef.current?.focus()
    } else {
      showFeedback('error', 'Produto não encontrado')
    }
  }, [searchTerm, filteredProducts, addToCart, setSearchTerm, showFeedback])

  useEffect(() => {
    if (cartCount === 0) {
      setSelectedCartItemIndex(0)
    } else if (selectedCartItemIndex >= cartCount) {
      setSelectedCartItemIndex(cartCount - 1)
    }
  }, [cartCount, selectedCartItemIndex, setSelectedCartItemIndex])

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  const handleContainerClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  const handleFocusSearch = useCallback(() => searchInputRef.current?.focus(), [])

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
    <div 
      className={`min-h-screen bg-gray-100 dark:bg-black ${isKioskMode ? 'kiosk-mode' : ''} cursor-pointer`}
      onClick={handleContainerClick}
    >
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-1.5 px-3 text-center text-xs font-medium shadow-md">
          <div className="flex items-center justify-center gap-2">
            <WifiOff size={14} />
            <span>MODO OFFLINE - Vendas salvas localmente</span>
          </div>
        </div>
      )}
      
      <div className={`max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 ${!isOnline ? 'pt-10' : ''} ${isMobile ? 'mb-20' : ''}`}>
        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={hideFeedback}
            position="fixed"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 pb-28 lg:pb-0">
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
              onSearchSubmit={isMobile ? handleSearchSubmitMobile : handleSearchSubmit}
            />
          </div>

          <div className="lg:col-span-1 order-1 lg:order-2 hidden lg:block">
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
                        onClick={handlers.handleClearCart}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        title="Limpar carrinho [Del]"
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
                onClearCart={handlers.handleClearCart} 
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
                  onClick={openPaymentModal}
                  disabled={cartCount === 0 || isMutating} 
                  icon={CreditCard} 
                >
                  {!isOnline ? 'Salvar Venda Offline' : 'Finalizar Venda'}
                  <span className="ml-2 opacity-60 text-sm">[Ctrl+Enter]</span>
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
            onClearCart={handlers.handleClearCart}
            onCheckout={openPaymentModal}
            disabled={isMutating}
          />
        )}

        <SalesModalsContainer
          showCustomerModal={showCustomerModal}
          closeCustomerModal={closeCustomerModal}
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          handleSearchCustomer={handlers.handleSearchCustomer}
          isSearching={isSearching}
          showQuickCustomerModal={showQuickCustomerModal}
          setShowQuickCustomerModal={setShowQuickCustomerModal}
          quickCustomerForm={quickCustomerForm}
          setQuickCustomerForm={setQuickCustomerForm}
          quickCustomerErrors={quickCustomerErrors}
          quickRegisterCustomer={quickRegisterCustomer}
          isCreating={isCreating}
          showCouponModal={showCouponModal}
          closeCouponModal={closeCouponModal}
          customer={customer}
          coupon={coupon}
          availableCoupons={availableCoupons}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponError={couponError}
          handleApplyCoupon={handlers.handleApplyCoupon}
          removeCoupon={removeCoupon}
          isValidating={isValidating}
          showPaymentModal={showPaymentModal}
          closePaymentModal={closePaymentModal}
          cart={cart}
          discount={discount}
          subtotal={subtotal}
          total={total}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          confirmPayment={handlers.confirmPayment}
          isSubmitting={createSaleMutation.isPending}
          isOnline={isOnline}
          createPendingSale={handlers.createPendingSale}
          showClearCartConfirm={showClearCartConfirm}
          closeClearCartConfirm={closeClearCartConfirm}
          confirmClearCart={handlers.confirmClearCart}
          showShortcutsHelp={showShortcutsHelp}
          closeShortcutsHelp={closeShortcutsHelp}
          shortcuts={[]}
          showReceiptModal={showReceiptModal}
          closeReceiptModal={closeReceiptModal}
          completedSaleData={completedSaleData}
          profile={null}
        />
      </div>
    </div>
  )
}

export default Sales