import React, { useState, useEffect, useRef } from 'react'
import { Phone } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import useSystemLogs from '../hooks/useSystemLogs'

import ProductGrid from '../components/sales/pdv/ProductGrid'
import CartItem from '../components/sales/pdv/CartItem'
import CartSummary from '../components/sales/pdv/CartSummary'
import CustomerSelector from '../components/sales/pdv/CustomerSelector'
import QuickCustomerForm from '../components/sales/pdv/QuickCustomerForm'
import CouponSelector from '../components/sales/pdv/CouponSelector'
import PaymentMethodSelector from '../components/sales/pdv/PaymentMethodSelector'
import QuantityModal from '../components/sales/pdv/QuantityModal'
import CheckoutModal from '../components/sales/pdv/CheckoutModal'

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
  
  // Cliente
  const [customerPhone, setCustomerPhone] = useState('')
  const [customer, setCustomer] = useState(null)
  
  // Cupom
  const [couponCode, setCouponCode] = useState('')
  const [coupon, setCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [discount, setDiscount] = useState(0)
  const [availableCoupons, setAvailableCoupons] = useState([])
  
  // Pagamento
  const [paymentMethod, setPaymentMethod] = useState('cash')
  
  // Modais
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showQuantityModal, setShowQuantityModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedItemForQuantity, setSelectedItemForQuantity] = useState(null)
  const [tempQuantity, setTempQuantity] = useState(1)
  
  // Formulário rápido
  const [quickCustomerForm, setQuickCustomerForm] = useState({ name: '', phone: '', email: '' })
  const [quickCustomerErrors, setQuickCustomerErrors] = useState({})
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false)
  
  // Feedback
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const searchInputRef = useRef(null)

  useEffect(() => { fetchProducts() }, [])
  useEffect(() => { filterProducts() }, [searchTerm, selectedCategory, products])
  useEffect(() => { if (customer) fetchAvailableCoupons() }, [customer])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('products').select('*').eq('is_active', true).gt('stock_quantity', 0).order('name')
      if (error) throw error
      setProducts(data || [])
      setFilteredProducts(data || [])
      setCategories([...new Set(data?.map(p => p.category).filter(Boolean))])
    } catch (error) {
      showFeedback('error', 'Erro ao carregar produtos')
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = [...products]
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(p => p.name?.toLowerCase().includes(search) || p.code?.toLowerCase().includes(search))
    }
    if (selectedCategory !== 'all') filtered = filtered.filter(p => p.category === selectedCategory)
    setFilteredProducts(filtered)
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id)
    if (existing) {
      if (existing.quantity + 1 > product.stock_quantity) {
        showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
        return
      }
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item))
    } else {
      setCart([...cart, { id: product.id, name: product.name, code: product.code, price: product.price, quantity: 1, total: product.price, unit: product.unit, stock: product.stock_quantity }])
    }
  }

  const openQuantityModal = (item) => {
    setSelectedItemForQuantity(item)
    setTempQuantity(item.quantity)
    setShowQuantityModal(true)
  }

  const confirmQuantityChange = () => {
    if (!selectedItemForQuantity) return
    const product = products.find(p => p.id === selectedItemForQuantity.id)
    if (tempQuantity <= 0) {
      setCart(cart.filter(item => item.id !== selectedItemForQuantity.id))
    } else if (tempQuantity > product.stock_quantity) {
      showFeedback('error', `Estoque insuficiente! Disponível: ${product.stock_quantity}`)
      return
    } else {
      setCart(cart.map(item => item.id === selectedItemForQuantity.id ? { ...item, quantity: tempQuantity, total: tempQuantity * item.price } : item))
    }
    setShowQuantityModal(false)
    setSelectedItemForQuantity(null)
  }

  const searchCustomer = async () => {
    if (!customerPhone || customerPhone.length < 10) {
      showFeedback('error', 'Digite um telefone válido')
      return
    }
    try {
      const { data, error } = await supabase.from('customers').select('*').eq('phone', customerPhone).maybeSingle()
      if (error) throw error
      if (data) {
        setCustomer(data)
        showFeedback('success', `Cliente encontrado: ${data.name}`)
        setShowCustomerModal(false)
      } else {
        setQuickCustomerForm({ name: '', phone: customerPhone, email: '' })
        setShowCustomerModal(false)
        setShowQuickCustomerModal(true)
      }
    } catch (error) {
      showFeedback('error', 'Erro ao buscar cliente')
    }
  }

  const quickRegisterCustomer = async () => {
    const errors = {}
    if (!quickCustomerForm.name?.trim()) errors.name = 'Nome é obrigatório'
    if (!quickCustomerForm.phone?.trim() || quickCustomerForm.phone.length < 10) errors.phone = 'Telefone inválido'
    if (quickCustomerForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickCustomerForm.email)) errors.email = 'E-mail inválido'
    if (Object.keys(errors).length > 0) { setQuickCustomerErrors(errors); return }
    
    setIsSubmittingCustomer(true)
    try {
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', quickCustomerForm.phone).maybeSingle()
      if (existing) {
        const { data: customerData } = await supabase.from('customers').select('*').eq('id', existing.id).single()
        setCustomer(customerData)
        showFeedback('success', `Cliente já existente: ${customerData.name}`)
        setShowQuickCustomerModal(false)
        return
      }
      
      const { data: newCustomer, error } = await supabase.from('customers').insert([{ ...quickCustomerForm, status: 'active', created_by: profile?.id }]).select().single()
      if (error) throw error
      setCustomer(newCustomer)
      showFeedback('success', `Cliente ${newCustomer.name} cadastrado!`)
      setShowQuickCustomerModal(false)
      await logCreate('customer', newCustomer.id, { name: newCustomer.name, phone: newCustomer.phone })
    } catch (error) {
      showFeedback('error', 'Erro ao cadastrar cliente: ' + error.message)
    } finally {
      setIsSubmittingCustomer(false)
    }
  }

  const fetchAvailableCoupons = async () => {
    try {
      const today = new Date().toISOString()
      const { data: global } = await supabase.from('coupons').select('*').eq('is_active', true).eq('is_global', true).lte('valid_from', today).gte('valid_to', today)
      let restricted = []
      if (customer) {
        const { data: allowed } = await supabase.from('coupon_allowed_customers').select('coupon_id').eq('customer_id', customer.id)
        if (allowed?.length) {
          const { data } = await supabase.from('coupons').select('*').eq('is_active', true).in('id', allowed.map(a => a.coupon_id)).lte('valid_from', today).gte('valid_to', today)
          restricted = data || []
        }
      }
      setAvailableCoupons([...(global || []), ...restricted])
    } catch (error) {
      console.error('Erro ao buscar cupons:', error)
    }
  }

  const validateCoupon = async (couponToValidate = null) => {
    const code = couponToValidate?.code || couponCode
    if (!code) { setCouponError('Digite o código do cupom'); return false }
    if (!customer) { setCouponError('Identifique um cliente para usar cupons'); return false }
    
    try {
      const { data, error } = await supabase.from('coupons').select('*').eq('code', code.toUpperCase()).eq('is_active', true).single()
      if (error) { setCouponError('Cupom inválido'); return false }
      
      const today = new Date()
      if (today < new Date(data.valid_from) || today > new Date(data.valid_to)) { setCouponError('Cupom expirado'); return false }
      if (data.usage_limit && data.used_count >= data.usage_limit) { setCouponError('Cupom esgotado'); return false }
      
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
      if (subtotal < data.min_purchase) { setCouponError(`Valor mínimo: R$ ${data.min_purchase.toFixed(2)}`); return false }
      
      if (!data.is_global) {
        const { data: allowed } = await supabase.from('coupon_allowed_customers').select('*').eq('coupon_id', data.id).eq('customer_id', customer.id).single()
        if (!allowed) { setCouponError('Cupom não disponível para este cliente'); return false }
      }
      
      let discountValue = data.discount_type === 'percent' ? (subtotal * data.discount_value) / 100 : data.discount_value
      if (data.discount_type === 'percent' && data.max_discount) discountValue = Math.min(discountValue, data.max_discount)
      discountValue = Math.min(discountValue, subtotal)
      
      setCoupon(data)
      setCouponCode(data.code)
      setDiscount(discountValue)
      setCouponError('')
      showFeedback('success', `Cupom aplicado!`)
      setShowCouponModal(false)
      return true
    } catch (error) {
      setCouponError('Erro ao validar cupom')
      return false
    }
  }

  const removeCoupon = () => { setCoupon(null); setCouponCode(''); setDiscount(0); showFeedback('info', 'Cupom removido') }
  const clearCustomer = () => { setCustomer(null); setCustomerPhone(''); if (coupon) removeCoupon(); showFeedback('info', 'Cliente removido') }

  const confirmPayment = async () => {
    setIsSubmitting(true)
    try {
      const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
      const total = subtotal - discount
      
      const { data: sale, error: saleError } = await supabase.from('sales').insert([{
        customer_id: customer?.id || null, customer_name: customer?.name || null, customer_phone: customer?.phone || null,
        total_amount: subtotal, discount_amount: discount, discount_percent: coupon?.discount_type === 'percent' ? coupon.discount_value : 0,
        coupon_code: coupon?.code || null, final_amount: total, payment_method: paymentMethod, payment_status: 'paid',
        status: 'completed', created_by: profile?.id
      }]).select().single()
      if (saleError) throw saleError
      
      const saleItems = cart.map(item => ({ sale_id: sale.id, product_id: item.id, product_name: item.name, product_code: item.code, quantity: item.quantity, unit_price: item.price, total_price: item.total }))
      await supabase.from('sale_items').insert(saleItems)
      
      if (coupon) {
        await supabase.from('coupons').update({ used_count: coupon.used_count + 1 }).eq('id', coupon.id)
        if (customer) await supabase.from('customer_coupons').insert([{ coupon_id: coupon.id, customer_id: customer.id, sale_id: sale.id }])
      }
      if (customer) await supabase.from('customers').update({ last_purchase: new Date().toISOString(), total_purchases: (customer.total_purchases || 0) + total }).eq('id', customer.id)
      
      await logCreate('sale', sale.id, { sale_number: sale.sale_number, total_amount: subtotal, discount, final_amount: total })
      showFeedback('success', `Venda finalizada! Nº: ${sale.sale_number}`)
      
      setCart([]); setCustomer(null); setCustomerPhone(''); setCoupon(null); setCouponCode(''); setDiscount(0); setShowPaymentModal(false)
      await fetchProducts()
    } catch (error) {
      showFeedback('error', 'Erro ao finalizar venda: ' + error.message)
      await logError('sale', error, { action: 'create_sale' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm sticky top-4">
              <div className="p-4 border-b">
                <CustomerSelector customer={customer} onClear={clearCustomer} onOpenModal={() => setShowCustomerModal(true)} />
                <CouponSelector
                  customer={customer} coupon={coupon} availableCoupons={availableCoupons}
                  couponCode={couponCode} setCouponCode={setCouponCode} couponError={couponError}
                  onApplyCoupon={validateCoupon} onRemoveCoupon={removeCoupon}
                  onOpenModal={() => setShowCouponModal(true)} onCloseModal={() => setShowCouponModal(false)}
                  showModal={showCouponModal}
                />
              </div>

              <CartSummary cart={cart} discount={discount} onEditItem={openQuantityModal} onCheckout={() => setShowPaymentModal(true)} />
            </div>
          </div>
        </div>

        <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Identificar Cliente" size="sm">
          <div className="space-y-4">
            <div className="text-center">
              <Phone size={48} className="mx-auto text-blue-600 mb-3" />
              <p className="text-gray-600 mb-4">Digite o telefone do cliente</p>
            </div>
            <input type="tel" placeholder="(11) 99999-9999" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full px-4 py-2 border rounded-lg" onKeyPress={(e) => e.key === 'Enter' && searchCustomer()} />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCustomerModal(false)} className="flex-1">Cancelar</Button>
              <Button onClick={searchCustomer} className="flex-1">Buscar</Button>
            </div>
          </div>
        </Modal>

        <QuickCustomerForm
          isOpen={showQuickCustomerModal} onClose={() => setShowQuickCustomerModal(false)}
          formData={quickCustomerForm} setFormData={setQuickCustomerForm}
          errors={quickCustomerErrors} onSubmit={quickRegisterCustomer} isSubmitting={isSubmittingCustomer}
        />

        <QuantityModal
          isOpen={showQuantityModal} onClose={() => setShowQuantityModal(false)}
          item={selectedItemForQuantity} maxStock={products.find(p => p.id === selectedItemForQuantity?.id)?.stock_quantity || 0}
          tempQuantity={tempQuantity} setTempQuantity={setTempQuantity}
          onConfirm={confirmQuantityChange} onRemove={() => { setCart(cart.filter(i => i.id !== selectedItemForQuantity?.id)); setShowQuantityModal(false) }}
        />

        <CheckoutModal
          isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)}
          cart={cart} discount={discount} customer={customer}
          paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod}
          onConfirm={confirmPayment} isSubmitting={isSubmitting}
        />
      </div>
    </div>
  )
}

export default Sales  