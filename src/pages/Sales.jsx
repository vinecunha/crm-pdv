// pages/Sales.jsx (versão atualizada)
import React, { useState, useEffect, useRef } from 'react'
import { 
  Plus, Minus, Trash2, ShoppingCart, Search, 
  Ticket, User, Phone, X, CheckCircle, 
  CreditCard, Banknote, Receipt, Printer,
  Package, AlertCircle, DollarSign, Percent,
  QrCode, Mail, UserPlus, ArrowRight, Edit2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext.jsx'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import FormInput from '../components/forms/FormInput'
import useSystemLogs from '../hooks/useSystemLogs'

const Sales = () => {
  const { profile } = useAuth()
  const { logCreate, logAction, logError } = useSystemLogs()
  
  // Estados
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categories, setCategories] = useState([])
  
  // Estados do carrinho
  const [customerPhone, setCustomerPhone] = useState('')
  const [customer, setCustomer] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [availableCoupons, setAvailableCoupons] = useState([])
  
  // Modais
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [selectedProductForQuantity, setSelectedProductForQuantity] = useState(null)
  const [tempQuantity, setTempQuantity] = useState(1)
  
  // Formulário de cadastro rápido
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [quickCustomerErrors, setQuickCustomerErrors] = useState({})
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false)
  
  // Feedback
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Referências
  const searchInputRef = useRef(null)

  // Carregar produtos ativos
  useEffect(() => {
    fetchProducts()
  }, [])

  // Filtrar produtos
  useEffect(() => {
    filterProducts()
  }, [searchTerm, selectedCategory, products])

  // Buscar cupons disponíveis quando cliente é identificado
  useEffect(() => {
    if (customer) {
      fetchAvailableCoupons()
    } else {
      setAvailableCoupons([])
    }
  }, [customer])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('name', { ascending: true })

      if (error) throw error
      
      setProducts(data || [])
      setFilteredProducts(data || [])
      
      const uniqueCategories = [...new Set(data?.map(p => p.category).filter(Boolean))]
      setCategories(uniqueCategories)
      
    } catch (error) {
      console.error('Erro ao carregar produtos:', error)
      showFeedback('error', 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(product =>
        product.name?.toLowerCase().includes(search) ||
        product.code?.toLowerCase().includes(search)
      )
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }
    
    setFilteredProducts(filtered)
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => {
      setFeedback({ show: false, type: 'success', message: '' })
    }, 3000)
  }

  // Adicionar ao carrinho
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id)
    
    if (existingItem) {
      if (existingItem.quantity + 1 > product.stock_quantity) {
        showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
        return
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
          : item
      ))
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
    }
    
    logAction({
      action: 'ADD_TO_CART',
      entityType: 'sale',
      details: {
        product_name: product.name,
        user_email: profile?.email
      }
    })
  }

  // Abrir modal para alterar quantidade
  const openQuantityModal = (product) => {
    setSelectedProductForQuantity(product)
    setTempQuantity(product.quantity)
    setShowQuantityModal(true)
  }

  // Confirmar alteração de quantidade
  const confirmQuantityChange = () => {
    if (!selectedProductForQuantity) return
    
    const originalProduct = products.find(p => p.id === selectedProductForQuantity.id)
    
    if (tempQuantity <= 0) {
      removeFromCart(selectedProductForQuantity.id)
    } else if (tempQuantity > originalProduct.stock_quantity) {
      showFeedback('error', `Estoque insuficiente! Disponível: ${originalProduct.stock_quantity}`)
      return
    } else {
      setCart(cart.map(item =>
        item.id === selectedProductForQuantity.id
          ? { ...item, quantity: tempQuantity, total: tempQuantity * item.price }
          : item
      ))
    }
    
    setShowQuantityModal(false)
    setSelectedProductForQuantity(null)
  }

  // Remover do carrinho
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  // Buscar cliente por telefone
  const searchCustomer = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      showFeedback('error', 'Digite um telefone válido (mínimo 10 dígitos)')
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', customerPhone)
        .maybeSingle()
      
      if (error) throw error
      
      if (data) {
        setCustomer(data)
        showFeedback('success', `Cliente encontrado: ${data.name}`)
        setShowCustomerModal(false)
        
        await logAction({
          action: 'SEARCH_CUSTOMER',
          entityType: 'customer',
          details: {
            phone: customerPhone,
            found: true,
            customer_name: data.name
          }
        })
      } else {
        setQuickCustomerForm({
          name: '',
          phone: customerPhone,
          email: ''
        })
        setShowCustomerModal(false)
        setShowQuickCustomerModal(true)
        
        await logAction({
          action: 'SEARCH_CUSTOMER',
          entityType: 'customer',
          details: {
            phone: customerPhone,
            found: false,
            action_taken: 'show_quick_register'
          }
        })
      }
      
    } catch (error) {
      console.error('Erro ao buscar cliente:', error)
      showFeedback('error', 'Erro ao buscar cliente')
    }
  }

  // Cadastro rápido de cliente
  const quickRegisterCustomer = async () => {
    const errors = {}
    if (!quickCustomerForm.name?.trim()) {
      errors.name = 'Nome é obrigatório'
    }
    if (!quickCustomerForm.phone?.trim()) {
      errors.phone = 'Telefone é obrigatório'
    } else if (quickCustomerForm.phone.length < 10) {
      errors.phone = 'Telefone inválido'
    }
    if (quickCustomerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickCustomerForm.email)) {
      errors.email = 'E-mail inválido'
    }
    
    if (Object.keys(errors).length > 0) {
      setQuickCustomerErrors(errors)
      return
    }
    
    setIsSubmittingCustomer(true)
    
    try {
      const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', quickCustomerForm.phone)
        .maybeSingle()
      
      if (existing) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('*')
          .eq('id', existing.id)
          .single()
        
        setCustomer(customerData)
        showFeedback('success', `Cliente já existente: ${customerData.name}`)
        setShowQuickCustomerModal(false)
        
        await logAction({
          action: 'CUSTOMER_ALREADY_EXISTS',
          entityType: 'customer',
          entityId: existing.id,
          details: { phone: quickCustomerForm.phone }
        })
        
        setIsSubmittingCustomer(false)
        return
      }
      
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert([{
          name: quickCustomerForm.name,
          phone: quickCustomerForm.phone,
          email: quickCustomerForm.email || null,
          status: 'active',
          created_at: new Date(),
          created_by: profile?.id
        }])
        .select()
        .single()
      
      if (error) throw error
      
      setCustomer(newCustomer)
      showFeedback('success', `Cliente ${newCustomer.name} cadastrado com sucesso!`)
      setShowQuickCustomerModal(false)
      
      await logCreate('customer', newCustomer.id, {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        created_by: profile?.email,
        via: 'quick_register_from_pdv'
      })
      
    } catch (error) {
      console.error('Erro ao cadastrar cliente:', error)
      showFeedback('error', 'Erro ao cadastrar cliente: ' + error.message)
      await logError('customer', error, {
        action: 'quick_register_from_pdv',
        form_data: { ...quickCustomerForm }
      })
    } finally {
      setIsSubmittingCustomer(false)
    }
  }

  // Buscar cupons disponíveis para o cliente
  const fetchAvailableCoupons = async () => {
    try {
      const today = new Date().toISOString()
      
      let query = supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .lte('valid_from', today)
        .gte('valid_to', today)
      
      // Cupons globais (sem restrição de cliente)
      const { data: globalCoupons, error: globalError } = await query
        .eq('is_global', true)
        .limit(5)
      
      if (globalError) throw globalError
      
      let restrictedCoupons = []
      
      // Cupons restritos que o cliente pode usar
      if (customer) {
        const { data: customerRestricted, error: restrictedError } = await supabase
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .eq('is_global', false)
          .lte('valid_from', today)
          .gte('valid_to', today)
          .in('id', supabase
            .from('coupon_allowed_customers')
            .select('coupon_id')
            .eq('customer_id', customer.id)
          )
        
        if (!restrictedError) {
          restrictedCoupons = customerRestricted || []
        }
      }
      
      setAvailableCoupons([...globalCoupons, ...restrictedCoupons])
      
    } catch (error) {
      console.error('Erro ao buscar cupons:', error)
    }
  }

  // Validar cupom (com regras de cliente)
  const validateCoupon = async (couponToValidate = null) => {
    const codeToValidate = couponToValidate?.code || couponCode
    
    if (!codeToValidate) {
      setCouponError('Digite o código do cupom')
      return false
    }
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', codeToValidate.toUpperCase())
        .eq('is_active', true)
        .single()
      
      if (error) {
        setCouponError('Cupom inválido')
        return false
      }
      
      // Verificar validade
      const today = new Date()
      const validFrom = new Date(data.valid_from)
      const validTo = new Date(data.valid_to)
      
      if (today < validFrom || today > validTo) {
        setCouponError('Cupom expirado')
        return false
      }
      
      // Verificar limite de uso
      if (data.usage_limit && data.used_count >= data.usage_limit) {
        setCouponError('Cupom já atingiu o limite de uso')
        return false
      }
      
      // REGRA: Cliente não identificado NÃO pode usar cupom
      if (!customer) {
        setCouponError('Identifique um cliente para usar cupons de desconto')
        return false
      }
      
      // REGRA: Cupom restrito exige cliente específico
      if (!data.is_global) {
        const { data: allowedCustomer } = await supabase
          .from('coupon_allowed_customers')
          .select('*')
          .eq('coupon_id', data.id)
          .eq('customer_id', customer.id)
          .single()
        
        if (!allowedCustomer) {
          setCouponError('Este cupom não está disponível para este cliente')
          return false
        }
      }
      
      // Verificar valor mínimo
      const subtotal = getSubtotal()
      if (subtotal < data.min_purchase) {
        setCouponError(`Valor mínimo para este cupom: R$ ${data.min_purchase.toFixed(2)}`)
        return false
      }
      
      setCoupon(data)
      setCouponCode(data.code)
      setCouponError('')
      calculateDiscount(data, subtotal)
      showFeedback('success', `Cupom aplicado: ${data.discount_value}${data.discount_type === 'percent' ? '%' : ' reais'} de desconto`)
      setShowCouponModal(false)
      
      await logAction({
        action: 'APPLY_COUPON',
        entityType: 'coupon',
        entityId: data.id,
        details: {
          coupon_code: data.code,
          customer_name: customer?.name,
          customer_phone: customerPhone
        }
      })
      
      return true
      
    } catch (error) {
      console.error('Erro ao validar cupom:', error)
      setCouponError('Erro ao validar cupom')
      return false
    }
  }

  const calculateDiscount = (couponData, subtotal) => {
    let discountValue = 0
    
    if (couponData.discount_type === 'percent') {
      discountValue = (subtotal * couponData.discount_value) / 100
      if (couponData.max_discount && discountValue > couponData.max_discount) {
        discountValue = couponData.max_discount
      }
    } else {
      discountValue = couponData.discount_value
      if (discountValue > subtotal) {
        discountValue = subtotal
      }
    }
    
    setDiscount(discountValue)
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCouponCode('')
    setDiscount(0)
    showFeedback('info', 'Cupom removido')
  }

  // Limpar cliente
  const clearCustomer = () => {
    setCustomer(null)
    setCustomerPhone('')
    // Remover cupom ao trocar de cliente
    if (coupon) {
      removeCoupon()
    }
    showFeedback('info', 'Cliente removido, venda como visitante')
    
    logAction({
      action: 'CLEAR_CUSTOMER',
      entityType: 'sale',
      details: { user_email: profile?.email }
    })
  }

  // Calcular totais
  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.total, 0)
  }

  const getTotal = () => {
    return getSubtotal() - discount
  }

  const getItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  // Finalizar venda
  const handleCheckout = () => {
    if (cart.length === 0) {
      showFeedback('error', 'Adicione itens ao carrinho')
      return
    }
    setShowPaymentModal(true)
  }

  const confirmPayment = async () => {
    setIsSubmitting(true)
    
    try {
      const subtotal = getSubtotal()
      const total = getTotal()
      
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          customer_id: customer?.id || null,
          customer_name: customer?.name || null,
          customer_phone: customer?.phone || customerPhone || null,
          total_amount: subtotal,
          discount_amount: discount,
          discount_percent: coupon?.discount_type === 'percent' ? coupon.discount_value : 0,
          coupon_code: coupon?.code || null,
          final_amount: total,
          payment_method: paymentMethod,
          payment_status: 'paid',
          status: 'completed',
          created_by: profile?.id,
          notes: `Venda realizada via PDV`
        }])
        .select()
        .single()
      
      if (saleError) throw saleError
      
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        product_code: item.code,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.total
      }))
      
      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems)
      
      if (itemsError) throw itemsError
      
      if (coupon) {
        await supabase
          .from('coupons')
          .update({ used_count: coupon.used_count + 1 })
          .eq('id', coupon.id)
        
        if (customer) {
          await supabase
            .from('customer_coupons')
            .insert([{
              coupon_id: coupon.id,
              customer_id: customer.id,
              sale_id: sale.id
            }])
        }
        
        await logAction({
          action: 'USE_COUPON',
          entityType: 'coupon',
          entityId: coupon.id,
          details: {
            coupon_code: coupon.code,
            sale_id: sale.id,
            customer_name: customer?.name
          }
        })
      }
      
      if (customer) {
        await supabase
          .from('customers')
          .update({ 
            last_purchase: new Date().toISOString(),
            total_purchases: (customer.total_purchases || 0) + total
          })
          .eq('id', customer.id)
      }
      
      await logCreate('sale', sale.id, {
        sale_number: sale.sale_number,
        total_amount: subtotal,
        discount: discount,
        final_amount: total,
        items_count: cart.length,
        customer_name: customer?.name,
        payment_method: paymentMethod
      })
      
      showFeedback('success', `Venda finalizada! Nº: ${sale.sale_number}`)
      
      setCart([])
      setCustomer(null)
      setCustomerPhone('')
      setCoupon(null)
      setCouponCode('')
      setDiscount(0)
      setShowPaymentModal(false)
      
      await fetchProducts()
      
    } catch (error) {
      console.error('Erro ao finalizar venda:', error)
      await logError('sale', error, {
        action: 'create_sale',
        cart_items: cart.length,
        customer_name: customer?.name
      })
      showFeedback('error', 'Erro ao finalizar venda: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  if (loading) {
    return <DataLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false, type: 'success', message: '' })}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Produtos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar produto por nome ou código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Todos
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="bg-white rounded-lg shadow-sm p-4 text-left hover:shadow-md transition-all hover:scale-105"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <Package size={24} className="text-blue-600" />
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{product.code || 'Sem código'}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">{formatCurrency(product.price)}</span>
                    <span className="text-xs text-gray-500">
                      Estoque: {product.stock_quantity} {product.unit}
                    </span>
                  </div>
                </button>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Package size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Nenhum produto encontrado</p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna Direita - Carrinho (Recibo) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-4">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ShoppingCart size={20} />
                    Carrinho
                  </h2>
                  <span className="text-sm text-gray-500">{getItemCount()} itens</span>
                </div>
                
                {/* Cliente */}
                <div>
                  {!customer ? (
                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-gray-500" />
                        <span className="text-sm">Cliente não identificado</span>
                      </div>
                      <Phone size={14} className="text-gray-400" />
                    </button>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-800">{customer.name}</p>
                            <p className="text-xs text-green-600">{customer.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={clearCustomer}
                          className="text-red-500 hover:text-red-700"
                          title="Remover cliente"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Cupom - Apenas para clientes identificados */}
                {customer ? (
                  <div className="mt-3">
                    {!coupon ? (
                      <>
                        <button
                          onClick={() => setShowCouponModal(true)}
                          className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          <Ticket size={16} />
                          <span className="text-sm">Adicionar cupom de desconto</span>
                        </button>
                        
                        {/* Sugestão de cupons disponíveis */}
                        {availableCoupons.length > 0 && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-700 mb-2 flex items-center gap-1">
                              <Percent size={12} />
                              Cupons disponíveis para você:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {availableCoupons.slice(0, 3).map(c => (
                                <button
                                  key={c.id}
                                  onClick={() => validateCoupon(c)}
                                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                >
                                  {c.code} ({c.discount_type === 'percent' ? `${c.discount_value}%` : `R$ ${c.discount_value}`})
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Ticket size={16} className="text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-green-800">{coupon.code}</p>
                              <p className="text-xs text-green-600">
                                {coupon.discount_type === 'percent' 
                                  ? `${coupon.discount_value}% de desconto`
                                  : `R$ ${coupon.discount_value} de desconto`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={removeCoupon}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-3">
                    <div className="w-full p-2 bg-gray-100 rounded-lg text-center">
                      <Ticket size={16} className="inline mr-1 text-gray-400" />
                      <span className="text-xs text-gray-500">Identifique um cliente para usar cupons</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de Itens - Modo RECIBO (apenas visualização) */}
              <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">Carrinho vazio</p>
                    <p className="text-xs text-gray-400">Clique nos produtos para adicionar</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-3 p-2 border-b border-gray-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.price)} / {item.unit}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Quantidade: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.total)}
                        </p>
                        <button
                          onClick={() => openQuantityModal(item)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1"
                        >
                          <Edit2 size={12} />
                          Alterar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totais */}
              <div className="border-t p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(getSubtotal())}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto</span>
                    <span>- {formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-green-600">{formatCurrency(getTotal())}</span>
                </div>
                
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Receipt size={18} />
                  Finalizar Venda
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Alteração de Quantidade */}
        <Modal
          isOpen={showQuantityModal}
          onClose={() => setShowQuantityModal(false)}
          title="Alterar Quantidade"
          size="sm"
        >
          {selectedProductForQuantity && (
            <div className="space-y-4">
              <div className="text-center">
                <Package size={48} className="mx-auto text-blue-600 mb-3" />
                <p className="font-medium text-gray-900">{selectedProductForQuantity.name}</p>
                <p className="text-sm text-gray-500">{formatCurrency(selectedProductForQuantity.price)} / {selectedProductForQuantity.unit}</p>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setTempQuantity(Math.max(1, tempQuantity - 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Minus size={20} />
                </button>
                <div className="text-center">
                  <input
                    type="number"
                    min="1"
                    max={products.find(p => p.id === selectedProductForQuantity.id)?.stock_quantity}
                    value={tempQuantity}
                    onChange={(e) => setTempQuantity(Math.min(
                      products.find(p => p.id === selectedProductForQuantity.id)?.stock_quantity || 999,
                      Math.max(1, parseInt(e.target.value) || 1)
                    ))}
                    className="w-24 text-center text-2xl font-bold py-2 border border-gray-300 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Estoque: {products.find(p => p.id === selectedProductForQuantity.id)?.stock_quantity} {selectedProductForQuantity.unit}
                  </p>
                </div>
                <button
                  onClick={() => setTempQuantity(tempQuantity + 1)}
                  disabled={tempQuantity >= (products.find(p => p.id === selectedProductForQuantity.id)?.stock_quantity || 0)}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <Plus size={20} />
                </button>
              </div>
              
              <div className="text-center pt-2">
                <p className="text-sm text-gray-600">Total do item</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(selectedProductForQuantity.price * tempQuantity)}
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (tempQuantity !== selectedProductForQuantity.quantity) {
                      removeFromCart(selectedProductForQuantity.id)
                    }
                    setShowQuantityModal(false)
                  }}
                  className="flex-1"
                >
                  Remover Item
                </Button>
                <Button
                  onClick={confirmQuantityChange}
                  className="flex-1"
                >
                  Confirmar
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal de Busca de Cliente */}
        <Modal
          isOpen={showCustomerModal}
          onClose={() => setShowCustomerModal(false)}
          title="Identificar Cliente"
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center">
              <Phone size={48} className="mx-auto text-blue-600 mb-3" />
              <p className="text-gray-600 mb-4">
                Digite o telefone do cliente para aplicar descontos e acumular pontos
              </p>
            </div>
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCustomerModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={searchCustomer} className="flex-1">
                Buscar Cliente
              </Button>
            </div>
            <p className="text-xs text-gray-400 text-center">
              Não encontrou o cliente? Ele será cadastrado automaticamente após a busca.
            </p>
          </div>
        </Modal>

        {/* Modal de Cadastro Rápido de Cliente */}
        <Modal
          isOpen={showQuickCustomerModal}
          onClose={() => !isSubmittingCustomer && setShowQuickCustomerModal(false)}
          title="Novo Cliente"
          size="sm"
          isLoading={isSubmittingCustomer}
        >
          <div className="space-y-4">
            <div className="text-center">
              <UserPlus size={48} className="mx-auto text-blue-600 mb-3" />
              <p className="text-gray-600 mb-2">
                Cliente não encontrado. Faça o cadastro rápido:
              </p>
            </div>
            
            <FormInput
              label="Nome Completo"
              name="name"
              value={quickCustomerForm.name}
              onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, name: e.target.value })}
              required
              error={quickCustomerErrors.name}
              placeholder="Digite o nome completo"
              icon={User}
            />
            
            <FormInput
              label="Telefone"
              name="phone"
              value={quickCustomerForm.phone}
              onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, phone: e.target.value })}
              required
              error={quickCustomerErrors.phone}
              placeholder="(11) 99999-9999"
              icon={Phone}
              disabled
            />
            
            <FormInput
              label="E-mail (opcional)"
              name="email"
              type="email"
              value={quickCustomerForm.email}
              onChange={(e) => setQuickCustomerForm({ ...quickCustomerForm, email: e.target.value })}
              error={quickCustomerErrors.email}
              placeholder="cliente@email.com"
              icon={Mail}
            />
            
            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setShowQuickCustomerModal(false)} 
                disabled={isSubmittingCustomer}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={quickRegisterCustomer} 
                loading={isSubmittingCustomer}
                className="flex-1"
              >
                Cadastrar
              </Button>
            </div>
            
            <p className="text-xs text-gray-400 text-center">
              Após o cadastro, o cliente será automaticamente vinculado à venda.
            </p>
          </div>
        </Modal>

        {/* Modal de Cupom */}
        <Modal
          isOpen={showCouponModal}
          onClose={() => setShowCouponModal(false)}
          title="Adicionar Cupom"
          size="sm"
        >
          <div className="space-y-4">
            <div className="text-center">
              <Ticket size={48} className="mx-auto text-blue-600 mb-3" />
              <p className="text-gray-600 mb-4">
                Digite o código do cupom de desconto
              </p>
            </div>
            
            {availableCoupons.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700 mb-2 font-medium">Seus cupons disponíveis:</p>
                <div className="flex flex-wrap gap-2">
                  {availableCoupons.map(c => (
                    <button
                      key={c.id}
                      onClick={() => validateCoupon(c)}
                      className="text-xs px-2 py-1 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <input
              type="text"
              placeholder="Ex: PRIMEIRACOMPRA"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
              onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
            />
            {couponError && (
              <p className="text-xs text-red-600">{couponError}</p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCouponModal(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={() => validateCoupon()} className="flex-1">
                Aplicar Cupom
              </Button>
            </div>
          </div>
        </Modal>

        {/* Modal de Pagamento */}
        <Modal
          isOpen={showPaymentModal}
          onClose={() => !isSubmitting && setShowPaymentModal(false)}
          title="Finalizar Compra"
          size="md"
          isLoading={isSubmitting}
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Itens:</span>
                <span>{getItemCount()} produtos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(getSubtotal())}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total a pagar:</span>
                <span className="text-green-600">{formatCurrency(getTotal())}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Banknote size={18} />
                  <span>Dinheiro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'credit_card'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={18} />
                  <span>Cartão Crédito</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('debit_card')}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'debit_card'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={18} />
                  <span>Cartão Débito</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    paymentMethod === 'pix'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <QrCode size={18} />
                  <span>PIX</span>
                </button>
              </div>
            </div>

            {customer && (
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">{customer.name}</p>
                    <p className="text-xs text-blue-600">{customer.phone}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPaymentModal(false)}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmPayment}
                loading={isSubmitting}
                className="flex-1"
              >
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}

export default Sales