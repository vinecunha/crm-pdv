import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, Keyboard, ShoppingCart, User, Ticket, CreditCard, WifiOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import useSystemLogs from '../hooks/useSystemLogs'
import usePDVShortcuts from '../hooks/usePDVShortcuts'
import { saveSaleOffline } from '../utils/offlineStorage'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { sanitizeObject } from '../utils/sanitize'

import ShortcutFeedback from '../components/ui/ShortcutFeedback'
import ProductGrid from '../components/sales/pdv/ProductGrid'
import CartSummary from '../components/sales/pdv/CartSummary'
import QuickCustomerForm from '../components/sales/pdv/QuickCustomerForm'
import CouponSelector from '../components/sales/pdv/CouponSelector'
import CheckoutModal from '../components/sales/pdv/CheckoutModal'
import ShortcutsHelpModal from '../components/ui/ShortcutsHelpModal'
import ConfirmModal from '../components/ui/ConfirmModal'

// ============= API Functions =============
const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('name')
  
  if (error) throw error
  return data || []
}

const fetchAvailableCoupons = async (customerId) => {
  if (!customerId) return []
  
  const today = new Date().toISOString()
  
  const [globalResult, allowedResult] = await Promise.all([
    supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .eq('is_global', true)
      .lte('valid_from', today)
      .gte('valid_to', today),
    supabase
      .from('coupon_allowed_customers')
      .select('coupon_id')
      .eq('customer_id', customerId)
  ])
  
  let restricted = []
  if (allowedResult.data?.length) {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .in('id', allowedResult.data.map(a => a.coupon_id))
      .lte('valid_from', today)
      .gte('valid_to', today)
    restricted = data || []
  }
  
  return [...(globalResult.data || []), ...restricted]
}

const searchCustomerByPhone = async (phone) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone.replace(/\D/g, ''))
    .maybeSingle()
    
  if (error) throw error
  return data
}

const createCustomer = async (customerData) => {
  const safeData = sanitizeObject(customerData) // ✅ Sanitizar
  
  const { data, error } = await supabase
    .from('customers')
    .insert([{ 
      ...safeData, 
      phone: safeData.phone.replace(/\D/g, ''),
      status: 'active',
      total_purchases: 0
    }])
    .select()
    .single()
    
  if (error) throw error
  return data
}

const validateCoupon = async ({ code, customerId, cartSubtotal }) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()
    
  if (error) throw new Error('Cupom inválido')
  
  const today = new Date()
  if (data.valid_from && today < new Date(data.valid_from)) {
    throw new Error('Cupom ainda não está válido')
  }
  if (data.valid_to && today > new Date(data.valid_to)) {
    throw new Error('Cupom expirado')
  }
  if (data.usage_limit && data.used_count >= data.usage_limit) {
    throw new Error('Cupom esgotado')
  }
  if (cartSubtotal < (data.min_purchase || 0)) {
    throw new Error(`Valor mínimo: ${formatCurrency(data.min_purchase)}`)
  }
  
  if (!data.is_global) {
    const { data: allowed } = await supabase
      .from('coupon_allowed_customers')
      .select('*')
      .eq('coupon_id', data.id)
      .eq('customer_id', customerId)
      .maybeSingle()
      
    if (!allowed) {
      throw new Error('Cupom não disponível para este cliente')
    }
  }
  
  let discountValue = data.discount_type === 'percent' 
    ? (cartSubtotal * data.discount_value) / 100 
    : data.discount_value
    
  if (data.discount_type === 'percent' && data.max_discount) {
    discountValue = Math.min(discountValue, data.max_discount)
  }
  discountValue = Math.min(discountValue, cartSubtotal)
  
  return { coupon: data, discountValue }
}

const createSale = async ({ cart, customer, coupon, discount, paymentMethod, profile }) => {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - discount
  
  // Criar venda
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert([{
      customer_id: customer?.id || null,
      customer_name: customer?.name || null,
      customer_phone: customer?.phone || null,
      total_amount: subtotal,
      discount_amount: discount,
      discount_percent: coupon?.discount_type === 'percent' ? coupon.discount_value : 0,
      coupon_code: coupon?.code || null,
      final_amount: total,
      payment_method: paymentMethod,
      payment_status: 'paid',
      status: 'completed',
      created_by: profile?.id
    }])
    .select()
    .single()
    
  if (saleError) throw saleError
  
  // Criar itens da venda
  const saleItems = cart.map(item => ({
    sale_id: sale.id,
    product_id: item.id,
    product_name: item.name,
    product_code: item.code,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.total
  }))
  
  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
  if (itemsError) throw itemsError
  
  // Atualizar estoque
  for (const item of cart) {
    await supabase
      .from('products')
      .update({ 
        stock_quantity: item.stock - item.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)
  }
  
  // Atualizar uso do cupom
  if (coupon) {
    await supabase
      .from('coupons')
      .update({ used_count: (coupon.used_count || 0) + 1 })
      .eq('id', coupon.id)
      
    if (customer) {
      await supabase
        .from('customer_coupons')
        .insert([{ coupon_id: coupon.id, customer_id: customer.id, sale_id: sale.id }])
    }
  }
  
  // Atualizar cliente
  if (customer) {
    await supabase
      .from('customers')
      .update({ 
        last_purchase: new Date().toISOString(),
        total_purchases: (customer.total_purchases || 0) + total
      })
      .eq('id', customer.id)
  }
  
  return sale
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0)
}

// ============= Componente Principal =============
const Sales = () => {
  const { profile } = useAuth()
  const { logCreate, logAction, logError } = useSystemLogs()
  const queryClient = useQueryClient()
  
  // Estados locais
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])
  const { isOnline } = useNetworkStatus()
  
  // Cliente
  const [customerPhone, setCustomerPhone] = useState('')
  const [customer, setCustomer] = useState(null)
  
  // Cupom
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount] = useState(0)
  
  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState('cash')
  
  // Modais
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [showClearCartConfirm, setShowClearCartConfirm] = useState(false)
  
  // Estados para atalhos
  const [selectedCartItemIndex, setSelectedCartItemIndex] = useState(0)
  const [shortcutFeedback, setShortcutFeedback] = useState(null)
  
  // Formulário rápido
  const [quickCustomerForm, setQuickCustomerForm] = useState({ name: '', phone: '', email: '' })
  const [quickCustomerErrors, setQuickCustomerErrors] = useState({})
  
  // Feedback
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  const searchInputRef = useRef(null)

  // ============= Queries =============
  const { 
    data: products = [], 
    isLoading,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ['products-active'],
    queryFn: fetchProducts,
    staleTime: 2 * 60 * 1000,
  })

  const { data: availableCoupons = [] } = useQuery({
    queryKey: ['available-coupons', customer?.id],
    queryFn: () => fetchAvailableCoupons(customer?.id),
    enabled: !!customer,
  })

  // ============= Mutations =============
  const searchCustomerMutation = useMutation({
    mutationFn: searchCustomerByPhone,
    onSuccess: (data) => {
      if (data) {
        setCustomer(data)
        showFeedback('success', `Cliente encontrado: ${data.name}`)
        setShowCustomerModal(false)
      } else {
        setQuickCustomerForm({ name: '', phone: customerPhone, email: '' })
        setShowCustomerModal(false)
        setShowQuickCustomerModal(true)
      }
    },
    onError: (error) => {
      showFeedback('error', 'Erro ao buscar cliente: ' + error.message)
    }
  })

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (data) => {
      setCustomer(data)
      await logCreate('customer', data.id, { name: data.name, phone: data.phone })
      showFeedback('success', `Cliente ${data.name} cadastrado!`)
      setShowQuickCustomerModal(false)
    },
    onError: (error) => {
      showFeedback('error', 'Erro ao cadastrar cliente: ' + error.message)
    }
  })

  const validateCouponMutation = useMutation({
    mutationFn: validateCoupon,
    onSuccess: (data) => {
      setCoupon(data.coupon)
      setCouponCode(data.coupon.code)
      setDiscount(data.discountValue)
      setCouponError('')
      setShowCouponModal(false)
      showFeedback('success', `Cupom ${data.coupon.code} aplicado! Desconto: ${formatCurrency(data.discountValue)}`)
    },
    onError: (error) => {
      setCouponError(error.message)
    }
  })

  const createSaleMutation = useMutation({
    mutationFn: createSale,
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
      
      // Limpar estados
      setCart([])
      setCustomer(null)
      setCustomerPhone('')
      setCoupon(null)
      setCouponCode('')
      setDiscount(0)
      setShowPaymentModal(false)
      setSelectedCartItemIndex(0)
    },
    onError: async (error) => {
      console.error('Erro ao finalizar venda:', error)
      
      // Se for erro de rede, tentar salvar offline
      if (!isOnline || error.message?.includes('network') || error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
        await handleOfflineSale()
      } else {
        showFeedback('error', 'Erro ao finalizar venda: ' + error.message)
        await logError('sale', error, { action: 'create_sale' })
      }
    }
  })

  // ============= Handler para venda OFFLINE =============
  const handleOfflineSale = async () => {
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
      const total = subtotal - discount
      
      // Preparar dados da venda
      const offlineSaleData = {
        // Dados da venda
        customer_id: customer?.id || null,
        customer_name: customer?.name || 'Cliente offline',
        customer_phone: customer?.phone || null,
        total_amount: subtotal,
        discount_amount: discount,
        discount_percent: coupon?.discount_type === 'percent' ? coupon.discount_value : 0,
        coupon_code: coupon?.code || null,
        final_amount: total,
        payment_method: paymentMethod,
        payment_status: 'pending',
        status: 'pending',
        created_by: profile?.id,
        created_by_email: profile?.email,
        
        // Itens do carrinho
        items: cart.map(item => ({
          product_id: item.id,
          product_name: item.name,
          product_code: item.code,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.total
        })),
        
        // Metadados offline
        offlineCreated: true,
        offlineCreatedAt: new Date().toISOString(),
      }
      
      // Salvar no IndexedDB
      const localId = await saveSaleOffline(offlineSaleData)
      
      // Registrar sincronização para quando voltar online
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        const registration = await navigator.serviceWorker.ready
        await registration.sync.register('sync-pending-sales')
      }
      
      // Atualizar estoque localmente (para consistência visual)
      updateLocalStock(cart)
      
      // Log
      await logCreate('sale', `offline-${localId}`, { 
        offline: true, 
        total_amount: subtotal, 
        discount, 
        final_amount: total 
      })
      
      showFeedback('success', `✅ Venda salva OFFLINE! Sincroniza quando houver internet.`)
      
      // Limpar estados
      setCart([])
      setCustomer(null)
      setCustomerPhone('')
      setCoupon(null)
      setCouponCode('')
      setDiscount(0)
      setShowPaymentModal(false)
      setSelectedCartItemIndex(0)
      
    } catch (error) {
      console.error('❌ Erro ao salvar offline:', error)
      showFeedback('error', 'Erro ao salvar venda offline: ' + error.message)
    }
  }

  // Atualizar estoque localmente (para consistência visual)
  const updateLocalStock = (cartItems) => {
    queryClient.setQueryData(['products-active'], (oldData) => {
      if (!oldData) return oldData
      
      return oldData.map(product => {
        const cartItem = cartItems.find(item => item.id === product.id)
        if (cartItem) {
          return {
            ...product,
            stock_quantity: product.stock_quantity - cartItem.quantity
          }
        }
        return product
      })
    })
  }

  // ============= Efeitos =============
  useEffect(() => {
    if (products.length > 0) {
      setCategories([...new Set(products.map(p => p.category).filter(Boolean))])
    }
  }, [products])

  useEffect(() => {
    if (cart.length === 0) {
      setSelectedCartItemIndex(0)
    } else if (selectedCartItemIndex >= cart.length) {
      setSelectedCartItemIndex(cart.length - 1)
    }
  }, [cart, selectedCartItemIndex])

  // ============= Produtos Filtrados =============
  const filteredProducts = React.useMemo(() => {
    let filtered = [...products]
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(search) || 
        p.code?.toLowerCase().includes(search) ||
        p.barcode?.toLowerCase().includes(search)
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    
    return filtered
  }, [products, searchTerm, selectedCategory])

  // ============= Handlers =============
  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    
    if (existing) {
      updateCartItemQuantity(product.id, existing.quantity + 1)
    } else {
      setCart([...cart, {
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
  }

  const updateCartItemQuantity = (productId, newQuantity) => {
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
        ? { 
            ...item, 
            quantity: newQuantity, 
            total: newQuantity * item.price 
          }
        : item
    ))
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
    
    logAction({
      action: 'REMOVE_FROM_CART',
      entityType: 'sale',
      details: { product_id: productId }
    })
  }

  const handleClearCart = () => {
    if (cart.length === 0) return
    setShowClearCartConfirm(true)
  }

  const confirmClearCart = () => {
    setCart([])
    setShowClearCartConfirm(false)
    showFeedback('info', 'Carrinho limpo')
    
    logAction({
      action: 'CLEAR_CART',
      entityType: 'sale',
      details: { items_removed: cart.length }
    })
  }

  const searchCustomer = () => {
    if (!customerPhone || customerPhone.length < 10) {
      showFeedback('error', 'Digite um telefone válido')
      return
    }
    searchCustomerMutation.mutate(customerPhone)
  }

  const quickRegisterCustomer = () => {
    const errors = {}
    if (!quickCustomerForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (!quickCustomerForm.phone?.trim() || quickCustomerForm.phone.length < 10) errors.phone = 'Telefone inválido'
    if (quickCustomerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickCustomerForm.email)) errors.email = 'E-mail inválido'
    
    if (Object.keys(errors).length > 0) { 
      setQuickCustomerErrors(errors)
      return 
    }
    
    createCustomerMutation.mutate(quickCustomerForm)
  }

  const clearCustomer = () => { 
    setCustomer(null)
    setCustomerPhone('')
    if (coupon) removeCoupon()
    showFeedback('info', 'Cliente removido')
  }

  const applyCoupon = (couponToValidate = null) => {
    const code = couponToValidate?.code || couponCode
    if (!code) { 
      setCouponError('Digite o código do cupom')
      return 
    }
    if (!customer) { 
      setCouponError('Identifique um cliente para usar cupons')
      return 
    }
    
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    
    validateCouponMutation.mutate({
      code,
      customerId: customer.id,
      cartSubtotal: subtotal
    })
  }

  const removeCoupon = () => { 
    setCoupon(null)
    setCouponCode('')
    setDiscount(0)
    showFeedback('info', 'Cupom removido')
  }

  const confirmPayment = (method = null) => {
    const finalPaymentMethod = method || paymentMethod
    
    if (!isOnline) {
      // Se estiver offline, ir direto para o fluxo offline
      handleOfflineSale()
      return
    }
    
    // Online - tentar enviar normalmente
    createSaleMutation.mutate({
      cart,
      customer,
      coupon,
      discount,
      paymentMethod: finalPaymentMethod,
      profile
    })
  }

  // ============= Handlers para Atalhos =============
  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleClearSearch = useCallback(() => {
    setSearchTerm('')
    setSelectedCategory('all')
  }, [])

  const handleRefreshProducts = useCallback(async () => {
    await refetchProducts()
    showFeedback('info', 'Produtos atualizados')
  }, [refetchProducts])

  const handleIncreaseQuantity = useCallback((item) => {
    updateCartItemQuantity(item.id, item.quantity + 1)
  }, [cart, products])

  const handleDecreaseQuantity = useCallback((item) => {
    updateCartItemQuantity(item.id, item.quantity - 1)
  }, [cart])

  const handleRemoveItem = useCallback((productId) => {
    removeFromCart(productId)
  }, [])

  const handleOpenCustomerModal = useCallback(() => {
    setShowCustomerModal(true)
  }, [])

  const handleClearCustomer = useCallback(() => {
    clearCustomer()
  }, [customer, coupon])

  const handleOpenCouponModal = useCallback(() => {
    if (customer) {
      setShowCouponModal(true)
    } else {
      showFeedback('warning', 'Identifique um cliente primeiro')
    }
  }, [customer])

  const handleRemoveCoupon = useCallback(() => {
    removeCoupon()
  }, [])

  const handleOpenPaymentModal = useCallback(() => {
    if (cart.length === 0) {
      showFeedback('warning', 'Adicione itens ao carrinho')
      return
    }
    setShowPaymentModal(true)
  }, [cart])

  const handleConfirmPayment = useCallback(async (method = null) => {
    confirmPayment(method)
  }, [cart, discount, customer, coupon, paymentMethod, isOnline])

  const handleCancelPayment = useCallback(() => {
    setShowPaymentModal(false)
  }, [])

  const handleShortcutFeedback = useCallback((shortcut) => {
    setShortcutFeedback(shortcut)
  }, [])

  // Hook de atalhos
  const { shortcuts } = usePDVShortcuts({
    onFocusSearch: handleFocusSearch,
    onClearSearch: handleClearSearch,
    onRefreshProducts: handleRefreshProducts,
    onClearCart: handleClearCart,
    onIncreaseQuantity: handleIncreaseQuantity,
    onDecreaseQuantity: handleDecreaseQuantity,
    onRemoveItem: handleRemoveItem,
    onOpenCustomerModal: handleOpenCustomerModal,
    onClearCustomer: handleClearCustomer,
    onOpenCouponModal: handleOpenCouponModal,
    onRemoveCoupon: handleRemoveCoupon,
    onOpenPaymentModal: handleOpenPaymentModal,
    onConfirmPayment: handleConfirmPayment,
    onCancelPayment: handleCancelPayment,
    onOpenHelp: () => setShowShortcutsHelp(true),
    cartItems: cart,
    selectedCartItemIndex,
    setSelectedCartItemIndex,
    onShortcutFeedback: handleShortcutFeedback,
    enabled: !showCustomerModal && !showQuickCustomerModal && !showCouponModal && !showPaymentModal && !showShortcutsHelp && !showClearCartConfirm
  })

  // Calcular totais
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - discount

  const isMutating = searchCustomerMutation.isPending || createCustomerMutation.isPending || 
                     validateCouponMutation.isPending || createSaleMutation.isPending

  if (isLoading) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Indicador de modo OFFLINE */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white py-2 px-4 text-center text-sm font-medium shadow-md">
          <div className="flex items-center justify-center gap-2">
            <WifiOff size={16} />
            <span>MODO OFFLINE - As vendas serão salvas localmente e sincronizadas quando a internet voltar</span>
          </div>
        </div>
      )}
      
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 ${!isOnline ? 'pt-12' : ''}`}>
        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback({ show: false })} 
          />
        )}

        {shortcutFeedback && (
          <ShortcutFeedback 
            shortcut={shortcutFeedback} 
            onHide={() => setShortcutFeedback(null)} 
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="text-blue-600" />
              Ponto de Venda (PDV)
            </h1>
            <p className="text-gray-600 mt-1">
              Realize vendas rapidamente com atalhos de teclado
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcutsHelp(true)}
            shortcut={{ key: 'F1', description: 'Atalhos' }}
            icon={Keyboard}
          >
            Atalhos (F1)
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da Esquerda - Produtos */}
          <div className="lg:col-span-2">
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

          {/* Coluna da Direita - Carrinho e Resumo */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <ShoppingCart size={18} />
                  Carrinho
                  {cart.length > 0 && (
                    <span className="ml-auto text-sm text-gray-500">
                      {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                    </span>
                  )}
                </h2>
              </div>

              <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Cliente</span>
                  </div>
                  {customer ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 truncate max-w-[150px]">
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
                      onClick={() => setShowCustomerModal(true)}
                      shortcut={{ key: 'C', alt: true, description: 'Cliente' }}
                      disabled={isMutating}
                    >
                      Identificar
                    </Button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">Cupom</span>
                  </div>
                  {coupon ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium">
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
                      shortcut={{ key: 'U', alt: true, description: 'Cupom' }}
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
                onCheckout={() => setShowPaymentModal(true)}
                selectedItemIndex={selectedCartItemIndex}
                onSelectItem={setSelectedCartItemIndex}
                disabled={isMutating}
              />

              <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto</span>
                      <span>- {formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span className="text-blue-600">{formatCurrency(total)}</span>
                  </div>
                </div>

                <Button
                  variant="success"
                  size="lg"
                  fullWidth
                  onClick={() => setShowPaymentModal(true)}
                  disabled={cart.length === 0 || isMutating}
                  icon={CreditCard}
                  shortcut={{ key: 'Enter', ctrl: true, description: 'Finalizar' }}
                >
                  {!isOnline ? 'Salvar Venda Offline' : 'Finalizar Venda'} (Ctrl+Enter)
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buscar Cliente */}
        <Modal 
          isOpen={showCustomerModal} 
          onClose={() => setShowCustomerModal(false)} 
          title="Identificar Cliente" 
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone size={28} className="text-blue-600" />
              </div>
              <p className="text-gray-600 mb-4">Digite o telefone do cliente</p>
            </div>
            <input 
              type="tel" 
              placeholder="(11) 99999-9999" 
              value={customerPhone} 
              onChange={(e) => setCustomerPhone(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-center" 
              onKeyPress={(e) => e.key === 'Enter' && searchCustomer()} 
              autoFocus
              disabled={searchCustomerMutation.isPending}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCustomerModal(false)} className="flex-1">
                Cancelar (ESC)
              </Button>
              <Button onClick={searchCustomer} loading={searchCustomerMutation.isPending} className="flex-1">
                Buscar
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal Cadastro Rápido */}
        <QuickCustomerForm
          isOpen={showQuickCustomerModal}
          onClose={() => setShowQuickCustomerModal(false)}
          formData={quickCustomerForm}
          setFormData={setQuickCustomerForm}
          errors={quickCustomerErrors}
          onSubmit={quickRegisterCustomer}
          isSubmitting={createCustomerMutation.isPending}
        />

        {/* Modal de Cupons */}
        <CouponSelector
          isOpen={showCouponModal}
          onClose={() => setShowCouponModal(false)}
          customer={customer}
          coupon={coupon}
          availableCoupons={availableCoupons}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponError={couponError}
          onApplyCoupon={applyCoupon}
          onRemoveCoupon={removeCoupon}
          isLoading={validateCouponMutation.isPending}
        />

        {/* Modal Finalizar Venda */}
        <CheckoutModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
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
        />

        {/* Modal de Confirmação - Limpar Carrinho */}
        <ConfirmModal
          isOpen={showClearCartConfirm}
          onClose={() => setShowClearCartConfirm(false)}
          onConfirm={confirmClearCart}
          title="Limpar Carrinho"
          message={
            <div>
              <p className="mb-2">Tem certeza que deseja remover todos os itens do carrinho?</p>
              <p className="text-sm text-gray-500">
                {cart.length} {cart.length === 1 ? 'item será' : 'itens serão'} removidos.
              </p>
            </div>
          }
          confirmText="Limpar Carrinho"
          cancelText="Cancelar"
          variant="danger"
        />

        {/* Modal de Atalhos */}
        <ShortcutsHelpModal
          isOpen={showShortcutsHelp}
          onClose={() => setShowShortcutsHelp(false)}
          shortcuts={shortcuts}
        />
      </div>
    </div>
  )
}

export default Sales