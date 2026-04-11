import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import useSystemLogs from '../hooks/useSystemLogs'
import useLogger from '../hooks/useLogger'

import CouponStats from '../components/coupons/CouponStats'
import CouponForm from '../components/coupons/CouponForm'
import CouponTable from '../components/coupons/CouponTable'
import CouponFilters from '../components/coupons/CouponFilters'
import CouponCustomersModal from '../components/coupons/CouponCustomersModal'

const Coupons = () => {
  const { profile } = useAuth()
  const { logError } = useSystemLogs()
  const { logComponentAction, logComponentError, logCreate, logUpdate, logDelete } = useLogger('Coupons')
  
  const [coupons, setCoupons] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  
  const [showModal, setShowModal] = useState(false)
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [allowedCustomers, setAllowedCustomers] = useState([])
  const [selectedCustomers, setSelectedCustomers] = useState([])
  
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', discount_type: 'percent',
    discount_value: '', max_discount: '', min_purchase: '0',
    is_global: true, is_active: true, valid_from: '', valid_to: '', usage_limit: ''
  })
  
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchCoupons()
    fetchCustomers()
    logComponentAction('ACCESS_PAGE', null, { page: 'coupons' })
  }, [])

  useEffect(() => { fetchCoupons() }, [searchTerm, filters])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      let query = supabase.from('coupons').select('*').order('created_at', { ascending: false })
      if (searchTerm.trim()) query = query.or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      if (filters.status && filters.status !== 'all') query = query.eq('is_active', filters.status === 'active')
      if (filters.discount_type && filters.discount_type !== 'all') query = query.eq('discount_type', filters.discount_type)
      if (filters.is_global && filters.is_global !== 'all') query = query.eq('is_global', filters.is_global === 'global')
      
      const { data, error } = await query
      if (error) throw error
      setCoupons(data || [])
    } catch (error) {
      showFeedback('error', 'Erro ao carregar cupons')
      await logComponentError(error, { action: 'fetch_coupons' })
    } finally {
      setLoading(false)
    }
  }

  const fetchCustomers = async () => {
    try {
      const { data } = await supabase.from('customers').select('id, name, phone, email').eq('status', 'active').order('name')
      setCustomers(data || [])
    } catch (error) { console.error('Erro ao carregar clientes:', error) }
  }

  const fetchAllowedCustomers = async (couponId) => {
    try {
      const { data } = await supabase.from('coupon_allowed_customers').select('customer_id, customers(id, name, phone, email)').eq('coupon_id', couponId)
      setAllowedCustomers(data || [])
      setSelectedCustomers((data || []).map(ac => ac.customer_id))
    } catch (error) { console.error('Erro ao carregar clientes permitidos:', error) }
  }

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setFormData({
        code: coupon.code, name: coupon.name, description: coupon.description || '',
        discount_type: coupon.discount_type, discount_value: coupon.discount_value,
        max_discount: coupon.max_discount || '', min_purchase: coupon.min_purchase || '0',
        is_global: coupon.is_global, is_active: coupon.is_active,
        valid_from: coupon.valid_from?.split('T')[0] || '',
        valid_to: coupon.valid_to?.split('T')[0] || '',
        usage_limit: coupon.usage_limit || ''
      })
      if (!coupon.is_global) fetchAllowedCustomers(coupon.id)
      else { setAllowedCustomers([]); setSelectedCustomers([]) }
    } else {
      setEditingCoupon(null)
      setFormData({ code: '', name: '', description: '', discount_type: 'percent', discount_value: '', max_discount: '', min_purchase: '0', is_global: true, is_active: true, valid_from: '', valid_to: '', usage_limit: '' })
      setAllowedCustomers([]); setSelectedCustomers([])
    }
    setShowModal(true)
  }

  const handleOpenCustomersModal = (coupon) => {
    setSelectedCoupon(coupon)
    fetchAllowedCustomers(coupon.id)
    setShowCustomersModal(true)
  }

  const handleSaveCoupon = async () => {
    if (!formData.code || !formData.name || !formData.discount_value || formData.discount_value <= 0) {
      showFeedback('error', 'Preencha todos os campos obrigatórios')
      return
    }
    
    setIsSubmitting(true)
    try {
      const couponData = {
        code: formData.code.toUpperCase(), name: formData.name, description: formData.description || null,
        discount_type: formData.discount_type, discount_value: parseFloat(formData.discount_value),
        max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
        min_purchase: parseFloat(formData.min_purchase) || 0,
        is_global: formData.is_global, is_active: formData.is_active,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : null,
        usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
        updated_by: profile?.id
      }
      
      let result
      if (editingCoupon) {
        const { data, error } = await supabase.from('coupons').update(couponData).eq('id', editingCoupon.id).select().single()
        if (error) throw error
        result = data
        await logUpdate('coupon', result.id, editingCoupon, result)
        showFeedback('success', `Cupom ${result.code} atualizado!`)
      } else {
        couponData.created_by = profile?.id
        const { data, error } = await supabase.from('coupons').insert([couponData]).select().single()
        if (error) throw error
        result = data
        await logCreate('coupon', result.id, result)
        showFeedback('success', `Cupom ${result.code} criado!`)
      }
      
      if (!formData.is_global && selectedCustomers.length > 0) {
        await supabase.from('coupon_allowed_customers').delete().eq('coupon_id', result.id)
        await supabase.from('coupon_allowed_customers').insert(selectedCustomers.map(customerId => ({ coupon_id: result.id, customer_id: customerId })))
      }
      
      setShowModal(false)
      fetchCoupons()
    } catch (error) {
      showFeedback('error', `Erro ao salvar: ${error.message}`)
      await logError('coupon', error, { action: editingCoupon ? 'update' : 'create' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCoupon = async (coupon) => {
    if (!confirm(`Excluir cupom ${coupon.code}?`)) return
    setIsSubmitting(true)
    try {
      await supabase.from('coupons').delete().eq('id', coupon.id)
      await logDelete('coupon', coupon.id, coupon)
      showFeedback('success', `Cupom ${coupon.code} excluído!`)
      fetchCoupons()
    } catch (error) {
      showFeedback('error', `Erro ao excluir: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (coupon) => {
    try {
      const newStatus = !coupon.is_active
      await supabase.from('coupons').update({ is_active: newStatus, updated_by: profile?.id }).eq('id', coupon.id)
      await logUpdate('coupon', coupon.id, coupon, { ...coupon, is_active: newStatus })
      showFeedback('success', `Cupom ${newStatus ? 'ativado' : 'desativado'}!`)
      fetchCoupons()
    } catch (error) {
      showFeedback('error', `Erro ao alterar status: ${error.message}`)
    }
  }

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code)
    showFeedback('success', `Código ${code} copiado!`)
  }

  const handleAddCustomer = async (customer) => {
    if (!selectedCoupon) return
    const { error } = await supabase.from('coupon_allowed_customers').insert([{ coupon_id: selectedCoupon.id, customer_id: customer.id }])
    if (!error) {
      setAllowedCustomers([...allowedCustomers, { customer_id: customer.id, customers: customer }])
      showFeedback('success', `${customer.name} adicionado!`)
    }
  }

  const handleRemoveCustomer = async (customerId) => {
    if (!selectedCoupon) return
    const { error } = await supabase.from('coupon_allowed_customers').delete().eq('coupon_id', selectedCoupon.id).eq('customer_id', customerId)
    if (!error) {
      setAllowedCustomers(allowedCustomers.filter(c => c.customer_id !== customerId))
      showFeedback('success', 'Cliente removido!')
    }
  }

  if (loading && coupons.length === 0) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cupons de Desconto</h1>
              <p className="text-gray-500 mt-1">Gerencie cupons globais e restritos para seus clientes</p>
            </div>
            <Button onClick={() => handleOpenModal()} icon={Plus}>Novo Cupom</Button>
          </div>
        </div>

        <CouponStats coupons={coupons} />
        <CouponFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} filters={filters} setFilters={setFilters} />

        <CouponTable
          coupons={coupons}
          onEdit={handleOpenModal}
          onManageCustomers={handleOpenCustomersModal}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteCoupon}
          onCopyCode={handleCopyCode}
        />

        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCoupon ? 'Editar Cupom' : 'Novo Cupom'} size="lg">
          <CouponForm
            formData={formData}
            setFormData={setFormData}
            isEditing={!!editingCoupon}
            customers={customers}
            selectedCustomers={selectedCustomers}
            setSelectedCustomers={setSelectedCustomers}
          />
          <div className="flex gap-3 pt-4 mt-4 border-t">
            <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancelar</Button>
            <Button onClick={handleSaveCoupon} loading={isSubmitting} className="flex-1">{editingCoupon ? 'Atualizar' : 'Criar'} Cupom</Button>
          </div>
        </Modal>

        <CouponCustomersModal
          isOpen={showCustomersModal}
          onClose={() => setShowCustomersModal(false)}
          coupon={selectedCoupon}
          allowedCustomers={allowedCustomers}
          setAllowedCustomers={setAllowedCustomers}
          customers={customers}
          onAddCustomer={handleAddCustomer}
          onRemoveCustomer={handleRemoveCustomer}
        />
      </div>
    </div>
  )
}

export default Coupons