import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Phone, 
  Keyboard, 
  ShoppingCart, 
  User, 
  Ticket, 
  CreditCard, 
  WifiOff, 
  FileText,
  Maximize,
  Minimize,
  RotateCcw
} from '../lib/icons'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import PageHeader from '../components/ui/PageHeader'
import ConfirmModal from '../components/ui/ConfirmModal'
import QuickCustomerForm from '../components/sales/pdv/QuickCustomerForm'
import CouponSelector from '../components/sales/pdv/CouponSelector'
import CheckoutModal from '../components/sales/pdv/CheckoutModal'
import ShortcutsHelpModal from '../components/ui/ShortcutsHelpModal'
import ProductGrid from '../components/sales/pdv/ProductGrid'
import CartSummary from '../components/sales/pdv/CartSummary'

// Componentes extras
import CompactCartView from '../components/sales/pdv/CompactCartView'
import SyncStatus from '../components/sales/pdv/SyncStatus'
import ShortcutFeedback from '../components/ui/ShortcutFeedback'

import useSystemLogs from '../hooks/useSystemLogs'
import usePDVShortcuts from '../hooks/usePDVShortcuts'
import useKioskMode from '../hooks/useKioskMode'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import useMediaQuery from '../hooks/useMediaQuery'

import { saveSaleOffline } from '../utils/offlineStorage'
import { formatCurrency } from '../utils/formatters'
import { supabase } from '../lib/supabase'
import * as saleService from '../services/saleService'

// ============= Componente Principal =============
const Sales = () => {
  const { profile } = useAuth()
  const { logCreate, logAction, logError } = useSystemLogs()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isMobile = useMediaQuery('(max-width: 1024px)')
  
  // Hook de modo quiosque
  const { isKioskMode, toggleKioskMode } = useKioskMode()
  
  // Estados locais
  const [cart, setCart] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])
  const { isOnline } = useNetworkStatus()
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const processingRef = useRef(false);

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
    queryFn: saleService.fetchProducts,
    staleTime: 2 * 60 * 1000,
  })

  const { data: availableCoupons = [] } = useQuery({
    queryKey: ['available-coupons', customer?.id],
    queryFn: () => saleService.fetchAvailableCoupons(customer?.id),
    enabled: !!customer,
  })

  // ============= Mutations =============
  const searchCustomerMutation = useMutation({
    mutationFn: saleService.searchCustomerByPhone,
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
    onError: (error) => showFeedback('error', 'Erro ao buscar cliente: ' + error.message)
  })

  const createCustomerMutation = useMutation({
    mutationFn: saleService.createCustomer,
    onSuccess: async (data) => {
      setCustomer(data)
      await logCreate('customer', data.id, { name: data.name, phone: data.phone })
      showFeedback('success', `Cliente ${data.name} cadastrado!`)
      setShowQuickCustomerModal(false)
    },
    onError: (error) => showFeedback('error', 'Erro ao cadastrar cliente: ' + error.message)
  })

  const validateCouponMutation = useMutation({
    mutationFn: ({ code, customerId, cartSubtotal }) => 
      saleService.validateCoupon(code, customerId, cartSubtotal),
    onSuccess: (data) => {
      setCoupon(data.coupon)
      setCouponCode(data.coupon.code)
      setDiscount(data.discountValue)
      setCouponError('')
      setShowCouponModal(false)
      showFeedback('success', `Cupom ${data.coupon.code} aplicado! Desconto: ${formatCurrency(data.discountValue)}`)
    },
    onError: (error) => setCouponError(error.message)
  })

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
      
      if (!isOnline || error.message?.includes('network') || error.message?.includes('fetch')) {
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
        id: product.id, name: product.name, code: product.code,
        price: product.price, quantity: 1, total: product.price,
        unit: product.unit, stock: product.stock_quantity
      }])
      logAction({ action: 'ADD_TO_CART', entityType: 'sale', details: { product_name: product.name } })
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
      item.id === productId ? { ...item, quantity: newQuantity, total: newQuantity * item.price } : item
    ))
  }

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId))
  }

  const handleClearCart = () => {
    if (cart.length === 0) return
    setShowClearCartConfirm(true)
  }

  const confirmClearCart = () => {
    setCart([])
    setShowClearCartConfirm(false)
    showFeedback('info', 'Carrinho limpo')
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
    if (!code) { setCouponError('Digite o código do cupom'); return }
    if (!customer) { setCouponError('Identifique um cliente para usar cupons'); return }
    
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    validateCouponMutation.mutate({ code, customerId: customer.id, cartSubtotal: subtotal })
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCouponCode('')
    setDiscount(0)
    showFeedback('info', 'Cupom removido')
  }

  const createPendingSale = async (callback) => {
    // 🛡️ Proteção contra duplo clique
    if (processingRef.current) {
      console.warn('⚠️ Já existe um processamento em andamento');
      return;
    }
    
    processingRef.current = true;
    setIsProcessingPayment(true);
    
    try {
      // Validar produtos
      const invalidProducts = cart.filter(item => {
        const product = products.find(p => p.id === item.id);
        return !product || !product.is_active || product.deleted_at;
      });
      
      if (invalidProducts.length > 0) {
        const names = invalidProducts.map(p => p.name).join(', ');
        throw new Error(`Produtos inválidos no carrinho: ${names}`);
      }

      const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
      const total = subtotal - discount;
      
      // Preparar itens
      const itemsJson = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_code: item.code,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total
      }));
      
      // Gerar chave de idempotência única
      const idempotencyKey = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      
      // 🔥 Chamar RPC (UMA ÚNICA VEZ)
      const { data, error } = await supabase
        .rpc('create_pending_sale', {
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
        });
        
      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao processar venda');
      }
      
      // Se foi duplicata prevenida, avisar no console
      if (data.duplicate_prevented) {
        console.log('ℹ️ Duplicata prevenida, usando venda existente:', data.sale_id);
      }
      
      // Fechar modal de pagamento IMEDIATAMENTE
      setShowPaymentModal(false);
      
      // Callback para gerar PIX (se necessário)
      if (callback) {
        callback(data.sale_id);
      }
      
    } catch (error) {
      console.error('❌ Erro ao criar venda pendente:', error);
      showFeedback('error', 'Erro: ' + error.message);
    } finally {
      // 🛡️ Liberar o lock após um delay (evita cliques acidentais)
      setTimeout(() => {
        processingRef.current = false;
        setIsProcessingPayment(false);
      }, 2000);
    }
  };

  const confirmPayment = (method = null) => {
    // 🛡️ Prevenir múltiplas chamadas
    if (processingRef.current || isProcessingPayment) {
      console.warn('⚠️ Pagamento já em processamento');
      return;
    }
    
    const finalPaymentMethod = method || paymentMethod;
    
    // Para PIX, usar o fluxo de venda pendente
    if (finalPaymentMethod === 'pix') {
      // Não chamar createSaleMutation para PIX!
      // O fluxo PIX é gerenciado pelo modal CheckoutModal via onCreatePendingSale
      return;
    }
    
    // Para outros métodos (dinheiro, cartão), usar o fluxo normal
    if (!isOnline) {
      handleOfflineSale();
      return;
    }
    
    createSaleMutation.mutate({ 
      cart, 
      customer, 
      coupon, 
      discount, 
      paymentMethod: finalPaymentMethod 
    });
  };

  // ============= Handlers para Atalhos =============
  const handleFocusSearch = useCallback(() => searchInputRef.current?.focus(), [])
  const handleClearSearch = useCallback(() => { setSearchTerm(''); setSelectedCategory('all') }, [])
  const handleRefreshProducts = useCallback(async () => { await refetchProducts(); showFeedback('info', 'Produtos atualizados') }, [refetchProducts])
  const handleIncreaseQuantity = useCallback((item) => updateCartItemQuantity(item.id, item.quantity + 1), [cart, products])
  const handleDecreaseQuantity = useCallback((item) => updateCartItemQuantity(item.id, item.quantity - 1), [cart])
  const handleRemoveItem = useCallback((productId) => removeFromCart(productId), [])
  const handleOpenCustomerModal = useCallback(() => setShowCustomerModal(true), [])
  const handleClearCustomer = useCallback(() => clearCustomer(), [customer, coupon])
  const handleOpenCouponModal = useCallback(() => {
    if (customer) setShowCouponModal(true)
    else showFeedback('warning', 'Identifique um cliente primeiro')
  }, [customer])
  const handleRemoveCoupon = useCallback(() => removeCoupon(), [])
  const handleOpenPaymentModal = useCallback(() => {
    if (cart.length === 0) showFeedback('warning', 'Adicione itens ao carrinho')
    else setShowPaymentModal(true)
  }, [cart])
  const handleShortcutFeedback = useCallback((shortcut) => setShortcutFeedback(shortcut), [])

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
    onOpenHelp: () => setShowShortcutsHelp(true),
    cartItems: cart,
    selectedCartItemIndex,
    setSelectedCartItemIndex,
    onShortcutFeedback: handleShortcutFeedback,
    enabled: !showCustomerModal && !showQuickCustomerModal && !showCouponModal && !showPaymentModal && !showShortcutsHelp && !showClearCartConfirm
  })

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - discount
  const isMutating = searchCustomerMutation.isPending || createCustomerMutation.isPending || 
                     validateCouponMutation.isPending || createSaleMutation.isPending

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
      onClick: () => setShowShortcutsHelp(true),
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
        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}
        {shortcutFeedback && <ShortcutFeedback shortcut={shortcutFeedback} onHide={() => setShortcutFeedback(null)} />}

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
                    {cart.length > 0 && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {cart.length} {cart.length === 1 ? 'item' : 'itens'}
                      </span>
                    )}
                  </h2>
                  
                  <div className="flex items-center gap-1">
                    {/* Botão de Modo Quiosque */}
                    {!isMobile && (
                      <button
                        onClick={toggleKioskMode}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        title={isKioskMode ? 'Sair do modo quiosque' : 'Modo quiosque'}
                      >
                        {isKioskMode ? <Minimize size={16} /> : <Maximize size={16} />}
                      </button>
                    )}
                    
                    {cart.length > 0 && (
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
                      onClick={() => setShowCustomerModal(true)} 
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
                      <span className="text-sm text-green-600 dark:text-green-400 font-medium">{coupon.code}</span>
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
                onCheckout={() => setShowPaymentModal(true)}
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
                  onClick={() => setShowPaymentModal(true)}
                  disabled={cart.length === 0 || isMutating} 
                  icon={CreditCard} 
                >
                  {!isOnline ? 'Salvar Venda Offline' : 'Finalizar Venda'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Componentes flutuantes */}
        <SyncStatus />
        
        {/* Carrinho compacto para mobile */}
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
            onCheckout={() => setShowPaymentModal(true)}
            disabled={isMutating}
          />
        )}

        {/* Modais */}
        <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Identificar Cliente" size="sm">
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">Digite o telefone do cliente</p>
            </div>
            <input 
              type="tel" 
              placeholder="(11) 99999-9999" 
              value={customerPhone} 
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg text-center dark:bg-gray-800 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && searchCustomer()} 
              autoFocus 
              disabled={searchCustomerMutation.isPending} 
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCustomerModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={searchCustomer} loading={searchCustomerMutation.isPending} className="flex-1">Buscar</Button>
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
          isSubmitting={createCustomerMutation.isPending} 
        />

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
          onCreatePendingSale={createPendingSale} 
        />

        <ConfirmModal 
          isOpen={showClearCartConfirm} 
          onClose={() => setShowClearCartConfirm(false)} 
          onConfirm={confirmClearCart}
          title="Limpar Carrinho" 
          message="Tem certeza que deseja remover todos os itens?"
          confirmText="Limpar" 
          cancelText="Cancelar" 
          variant="danger" 
        />

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