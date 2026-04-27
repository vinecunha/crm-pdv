import React, { useState, useCallback, useRef, useMemo } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { usePDVRealtime } from '@hooks/pdv/usePDVRealtime'
import { usePDVFeedback } from '@hooks/pdv/usePDVFeedback'
import { usePDVModals } from '@hooks/pdv/usePDVModals'
import { usePDVCustomer } from '@hooks/pdv/usePDVCustomer'
import { usePDVCoupon } from '@hooks/pdv/usePDVCoupon'
import { usePDVPayment } from '@hooks/pdv/usePDVPayment'
import { usePDVSearch } from '@hooks/pdv/usePDVSearch'
import { useCart } from '@hooks/utils/useCart'
import { useSalesQueries } from '@hooks/queries/useSalesQueries'
import { useSaleMutations } from '@hooks/mutations'
import { saveSaleOffline } from '@utils/offlineStorage'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'
import { useNetworkStatus } from '@/hooks/utils/useNetworkStatus'
import type { CartItem, Customer, Coupon } from '@/types'

interface CompletedSaleData {
  sale: any
  cart: CartItem[]
  customer: Customer | null
  paymentMethod: string
  discount: number
}

interface UsePDVSalesConfig {
  onSaleCreated?: (sale: any) => void
  onSaleError?: (error: Error) => void
}

interface UsePDVSalesReturn {
  feedback: any
  shortcutFeedback: any
  showFeedback: (type: string, message: string) => void
  hideFeedback: () => void
  showShortcutFeedback: (shortcut: any) => void
  hideShortcutFeedback: () => void
  products: any[]
  isLoading: boolean
  refetchProducts: () => Promise<any>
  cart: CartItem[]
  addToCart: (product: any) => void
  updateCartItemQuantity: (id: number, quantity: number) => void
  removeFromCart: (id: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getTotal: (discount?: number) => number
  cartCount: number
  selectedCartItemIndex: number
  setSelectedCartItemIndex: (index: number) => void
  customer: any
  customerPhone: string
  quickCustomerForm: any
  quickCustomerErrors: Record<string, string>
  setCustomerPhone: (phone: string) => void
  setQuickCustomerForm: (form: any) => void
  setQuickCustomerErrors: (errors: Record<string, string>) => void
  searchCustomer: () => Promise<any>
  quickRegisterCustomer: () => Promise<any>
  clearCustomer: () => void
  isSearching: boolean
  isCreating: boolean
  coupon: any
  couponCode: string
  couponError: string
  discount: number
  availableCoupons: any[]
  setCouponCode: (code: string) => void
  setCouponError: (error: string) => void
  applyCoupon: () => Promise<any>
  removeCoupon: () => void
  isValidating: boolean
  paymentMethod: string
  setPaymentMethod: (method: string) => void
  isPix: boolean
  showCustomerModal: boolean
  showQuickCustomerModal: boolean
  showCouponModal: boolean
  showPaymentModal: boolean
  showShortcutsHelp: boolean
  showClearCartConfirm: boolean
  isAnyModalOpen: boolean
  showReceiptModal: boolean
  setShowReceiptModal: (show: boolean) => void
  setShowQuickCustomerModal: (show: boolean) => void
  setShowCouponModal: (show: boolean) => void
  openCustomerModal: () => void
  closeCustomerModal: () => void
  openCouponModal: () => void
  closeCouponModal: () => void
  openPaymentModal: () => void
  closePaymentModal: () => void
  openClearCartConfirm: () => void
  closeClearCartConfirm: () => void
  openReceiptModal: () => void
  closeReceiptModal: () => void
  openShortcutsHelp: () => void
  closeShortcutsHelp: () => void
  searchTerm: string
  selectedCategory: string
  categories: string[]
  filteredProducts: any[]
  setSearchTerm: (term: string) => void
  setSelectedCategory: (category: string) => void
  clearSearch: () => void
  updateCategories: (products: any[]) => void
  isOnline: boolean
  isProcessingPayment: boolean
  completedSaleData: CompletedSaleData | null
  searchInputRef: React.RefObject<any>
  handlers: {
    handleOfflineSale: () => Promise<void>
    handleClearCart: () => void
    confirmClearCart: () => void
    handleSearchCustomer: () => Promise<void>
    handleApplyCoupon: () => void
    confirmPayment: (method?: string | null) => void
    handleRefreshProducts: () => Promise<void>
    handleIncreaseQuantity: (item: CartItem) => void
    handleDecreaseQuantity: (item: CartItem) => void
    createPendingSale: () => Promise<void>
  }
  shortcuts: any[]
  updateLocalStock: (cartItems: CartItem[]) => void
  createSaleMutation: any
}

export const usePDVSales = (config?: UsePDVSalesConfig): UsePDVSalesReturn => {
  const { profile } = useAuth()
  const { isOnline } = useNetworkStatus()
  const processingRef = useRef(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [completedSaleData, setCompletedSaleData] = useState<CompletedSaleData | null>(null)

  usePDVRealtime(true)

  const { feedback, shortcutFeedback, showFeedback, hideFeedback, showShortcutFeedback, hideShortcutFeedback } = usePDVFeedback()

  const { products, isLoading, refetchProducts } = useSalesQueries()

  const { 
    cart, addToCart, updateQuantity: updateCartItemQuantity, 
    removeItem: removeFromCart, clearCart, getSubtotal, getTotal, 
    cartCount, selectedCartItemIndex, setSelectedCartItemIndex 
  } = useCart(products, { checkStock: true, onStockError: (msg) => showFeedback('error', msg) })

  const { customer, customerPhone, quickCustomerForm, quickCustomerErrors, setCustomerPhone, setQuickCustomerForm, setQuickCustomerErrors, searchCustomer, quickRegisterCustomer, clearCustomer, isSearching, isCreating } = usePDVCustomer(showFeedback)

  const { coupon, couponCode, couponError, discount, availableCoupons, setCouponCode, setCouponError, applyCoupon, removeCoupon, isValidating } = usePDVCoupon(customer, cart, showFeedback)

  const { paymentMethod, setPaymentMethod, isPix } = usePDVPayment()

  const modals = usePDVModals()

  const { searchTerm, selectedCategory, categories, filteredProducts, setSearchTerm, setSelectedCategory, clearSearch } = usePDVSearch(products)

  const handleOfflineSale = useCallback(async (): Promise<void> => {
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
      
      showFeedback('success', 'Venda salva OFFLINE!')
      
      clearCart()
      clearCustomer()
      removeCoupon()
      modals.closePaymentModal()
      modals.openReceiptModal()
      
    } catch (error) {
      logger.error('Erro ao salvar offline:', error)
      showFeedback('error', 'Erro ao salvar venda offline: ' + (error as Error).message)
    }
  }, [cart, customer, coupon, discount, paymentMethod, profile, getSubtotal, getTotal, clearCart, clearCustomer, removeCoupon, showFeedback, modals])

  const handleClearCart = useCallback(() => {
    if (cartCount === 0) return
    modals.openClearCartConfirm()
  }, [cartCount, modals])

  const confirmClearCart = useCallback(() => {
    clearCart()
    modals.closeClearCartConfirm()
    showFeedback('info', 'Carrinho limpo')
  }, [clearCart, modals, showFeedback])

  const handleSearchCustomer = useCallback(async (): Promise<void> => {
    const result = await searchCustomer()
    modals.closeCustomerModal()
    if (!result?.found) {
      modals.setShowQuickCustomerModal(true)
    }
  }, [searchCustomer, modals])

  const handleApplyCoupon = useCallback(() => {
    applyCoupon()
    modals.closeCouponModal()
  }, [applyCoupon, modals])

  const createPendingSale = useCallback(async (): Promise<void> => {
    if (processingRef.current) {
      logger.warn('Já existe um processamento em andamento')
      return
    }
    
    processingRef.current = true
    setIsProcessingPayment(true)
    
    try {
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
      
      modals.closePaymentModal()
      
    } catch (error) {
      logger.error('Erro ao criar venda pendente:', error)
      showFeedback('error', 'Erro: ' + (error as Error).message)
    } finally {
      setTimeout(() => {
        processingRef.current = false
        setIsProcessingPayment(false)
      }, 2000)
    }
  }, [cart, customer, coupon, discount, profile, getSubtotal, getTotal, supabase, modals, logger, showFeedback])

const { createSaleMutation: saleMutate } = useSaleMutations(profile, {
    onSaleCreated: (sale) => {
      showFeedback('success', `Venda #${sale.sale_number} finalizada!`)
      
      setCompletedSaleData({
        sale: sale,
        cart: [...cart],
        customer: customer ? { ...customer } : null,
        paymentMethod: paymentMethod,
        discount: discount
      })
      
      clearCart()
      clearCustomer()
      removeCoupon()
      modals.closePaymentModal()
      modals.openReceiptModal()
      
      config?.onSaleCreated?.(sale)
    },
    onSaleError: (error) => {
      if (!isOnline || error.message?.includes('network') || error.message?.includes('fetch')) {
        handleOfflineSale()
      } else {
        showFeedback('error', 'Erro ao finalizar venda: ' + error.message)
      }
      config?.onSaleError?.(error)
    }
  })

  const confirmPayment = useCallback((method: string | null = null) => {
    if (processingRef.current || isProcessingPayment) {
      logger.warn('Pagamento já em processamento')
      return
    }
    
    const finalPaymentMethod = method || paymentMethod
    
    if (finalPaymentMethod === 'pix') return
    
    if (!isOnline) {
      handleOfflineSale()
      return
    }
    
    saleMutate.mutate({ 
      cart, 
      customer, 
      coupon, 
      discount, 
      paymentMethod: finalPaymentMethod 
    })
  }, [isProcessingPayment, paymentMethod, isOnline, cart, customer, coupon, discount, handleOfflineSale, saleMutate])

  const handleRefreshProducts = useCallback(async (): Promise<void> => {
    await refetchProducts()
    showFeedback('info', 'Produtos atualizados')
  }, [refetchProducts, showFeedback])

  const handleIncreaseQuantity = useCallback((item: CartItem) => 
    updateCartItemQuantity(item.id, item.quantity + 1), 
    [updateCartItemQuantity]
  )
  
  const handleDecreaseQuantity = useCallback((item: CartItem) => 
    updateCartItemQuantity(item.id, item.quantity - 1), 
    [updateCartItemQuantity]
  )

  const handlers = useMemo(() => ({
    handleOfflineSale,
    handleClearCart,
    confirmClearCart,
    handleSearchCustomer,
    handleApplyCoupon,
    confirmPayment,
    handleRefreshProducts,
    handleIncreaseQuantity,
    handleDecreaseQuantity,
    createPendingSale
  }), [
    handleOfflineSale, handleClearCart, confirmClearCart, handleSearchCustomer,
    handleApplyCoupon, confirmPayment, handleRefreshProducts, handleIncreaseQuantity, 
    handleDecreaseQuantity, createPendingSale
  ])

  const updateCategories = useCallback((prods: any[]) => {
    setSelectedCategory('')
  }, [])

  const searchInputRef = useRef(null)

  const updateLocalStock = useCallback((cartItems: CartItem[]) => {
    // Implementation would go here - typically updates local cache
  }, [])

  return {
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
    ...modals,
    searchTerm,
    selectedCategory,
    categories,
    filteredProducts,
    setSearchTerm,
    setSelectedCategory,
    clearSearch,
    updateCategories,
    isOnline,
    isProcessingPayment,
    completedSaleData,
    searchInputRef,
    handlers,
    updateLocalStock,
    createSaleMutation: saleMutate
  }
}