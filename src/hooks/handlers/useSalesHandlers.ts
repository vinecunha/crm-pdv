import { useCallback } from 'react'
import { QueryClient } from '@tanstack/react-query'
import { SupabaseClient } from '@supabase/supabase-js'

// Baseado em: public.sales
interface Sale {
  id: number
  sale_number: string
  customer_id: number | null
  customer_name: string | null
  customer_phone: string | null
  total_amount: number
  discount_amount: number | null
  discount_percent: number | null
  coupon_code: string | null
  final_amount: number
  payment_method: string | null
  payment_status: string | null
  status: string | null
  notes: string | null
  created_at: string | null
  created_by: string | null
  updated_at: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  cancellation_notes: string | null
  approved_by: string | null
  created_by_name: string | null
}

// Baseado em: public.sale_items
interface SaleItem {
  product_id: number
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
  total_price: number
}

interface CartItem {
  id: number
  name: string
  code: string | null
  quantity: number
  price: number
  total: number
  [key: string]: unknown
}

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  [key: string]: unknown
}

interface Coupon {
  id: number
  code: string
  discount_type: 'fixed' | 'percent'
  discount_value: number
  [key: string]: unknown
}

interface Product {
  id: number
  name: string
  is_active: boolean | null
  deleted_at: string | null
  [key: string]: unknown
}

interface Profile {
  id: string
  [key: string]: unknown
}

interface OfflineSaleData {
  customer_id: number | null
  customer_name: string
  customer_phone: string | null
  total_amount: number
  discount_amount: number
  coupon_code: string | null
  final_amount: number
  payment_method: string
  created_by: string | undefined
  items: SaleItem[]
  offlineCreated: boolean
  offlineCreatedAt: string
}

interface CompletedSaleData {
  sale: {
    sale_number: string
    total_amount: number
    discount_amount: number
    final_amount: number
  }
  cart: CartItem[]
  customer: Customer | null
  paymentMethod: string
  discount: number
}

interface MutationResult<T> {
  mutate: (data: T, options?: { onSuccess?: (data?: unknown) => void; onError?: (error: Error) => void }) => void
}

interface Logger {
  log: (...args: unknown[]) => void
  warn: (...args: unknown[]) => void
  error: (...args: unknown[]) => void
}

interface UseSalesHandlersProps {
  profile: Profile | null
  cart: CartItem[]
  cartCount: number
  customer: Customer | null
  coupon: Coupon | null
  discount: number
  paymentMethod: string
  products: Product[]
  getSubtotal: () => number
  getTotal: (discount: number) => number
  clearCart: () => void
  clearCustomer: () => void
  removeCoupon: () => void
  addToCart: (product: Product) => void
  updateCartItemQuantity: (id: number, quantity: number) => void
  removeFromCart: (id: number) => void
  searchCustomer: () => Promise<{ found: boolean; [key: string]: unknown } | undefined>
  applyCoupon: () => void
  setCouponError: (error: string) => void
  setCustomerPhone: (phone: string) => void
  setQuickCustomerForm: (form: Record<string, unknown>) => void
  quickRegisterCustomer: (data: Record<string, unknown>) => void
  setShowQuickCustomerModal: (show: boolean) => void
  setShowCouponModal: (show: boolean) => void
  openCustomerModal: () => void
  closeCustomerModal: () => void
  openPaymentModal: () => void
  closePaymentModal: () => void
  openClearCartConfirm: () => void
  closeClearCartConfirm: () => void
  openShortcutsHelp: () => void
  closeShortcutsHelp: () => void
  openReceiptModal: () => void
  closeReceiptModal: () => void
  closeCouponModal: () => void
  showFeedback: (type: 'success' | 'error' | 'info', message: string) => void
  refetchProducts: () => Promise<void>
  updateCategories: () => void
  setSelectedCartItemIndex: (index: number) => void
  isOnline: boolean
  isProcessingPayment: boolean
  setIsProcessingPayment: (processing: boolean) => void
  processingRef: React.MutableRefObject<boolean>
  createSaleMutation: MutationResult<{
    cart: CartItem[]
    customer: Customer | null
    coupon: Coupon | null
    discount: number
    paymentMethod: string
  }>
  saveSaleOffline: (data: OfflineSaleData) => Promise<void>
  updateLocalStock: (cart: CartItem[]) => void
  logCreate: (entityType: string, entityId: string, details: Record<string, unknown>) => Promise<boolean>
  logError: (entityType: string, error: Error, details?: Record<string, unknown>) => Promise<boolean>
  setCompletedSaleData: (data: CompletedSaleData) => void
  queryClient: QueryClient
  supabase: SupabaseClient
  logger: Logger
}

interface UseSalesHandlersReturn {
  handleOfflineSale: () => Promise<void>
  handleClearCart: () => void
  confirmClearCart: () => void
  handleSearchCustomer: () => Promise<void>
  handleApplyCoupon: () => void
  createPendingSale: (callback?: (saleId: number) => void) => Promise<void>
  confirmPayment: (method?: string | null) => void
  handleRefreshProducts: () => Promise<void>
  handleIncreaseQuantity: (item: CartItem) => void
  handleDecreaseQuantity: (item: CartItem) => void
}

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
  updateCartItemQuantity,
  searchCustomer,
  applyCoupon,
  setShowQuickCustomerModal,
  openClearCartConfirm,
  closeClearCartConfirm,
  closeCustomerModal,
  closePaymentModal,
  openReceiptModal,
  closeCouponModal,
  showFeedback,
  refetchProducts,
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
  supabase,
  logger
}: UseSalesHandlersProps): UseSalesHandlersReturn => {

  const handleOfflineSale = useCallback(async (): Promise<void> => {
    try {
      const subtotal = getSubtotal()
      const total = getTotal(discount)
      
      const offlineSaleData: OfflineSaleData = {
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
      showFeedback('error', 'Erro ao salvar venda offline: ' + (error as Error).message)
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

  const handleSearchCustomer = useCallback(async (): Promise<void> => {
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

  const createPendingSale = useCallback(async (callback?: (saleId: number) => void): Promise<void> => {
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
      
      const itemsJson: SaleItem[] = cart.map(item => ({
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
      showFeedback('error', 'Erro: ' + (error as Error).message)
    } finally {
      setTimeout(() => {
        processingRef.current = false
        setIsProcessingPayment(false)
      }, 2000)
    }
  }, [cart, products, customer, coupon, discount, profile, getSubtotal, getTotal, supabase, closePaymentModal, logger, showFeedback, setIsProcessingPayment, processingRef])

  const confirmPayment = useCallback((method: string | null = null) => {
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