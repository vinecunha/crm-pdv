// src/pages/Coupons.jsx - Versão Limpa e Funcional
import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useReactQuery } from '../hooks/useReactQuery'
import useSystemLogs from '../hooks/useSystemLogs'
import useLogger from '../hooks/useLogger'

import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'

import CouponStats from '../components/coupons/CouponStats'
import CouponForm from '../components/coupons/CouponForm'
import CouponTable from '../components/coupons/CouponTable'
import CouponFilters from '../components/coupons/CouponFilters'
import CouponCustomersModal from '../components/coupons/CouponCustomersModal'

// ============= API Functions =============
const fetchCoupons = async ({ queryKey }) => {
  const [, { searchTerm, filters }] = queryKey
  
  let query = supabase.from('coupons').select('*').order('created_at', { ascending: false })
  
  if (searchTerm?.trim()) {
    query = query.or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('is_active', filters.status === 'active')
  }
  if (filters?.discount_type && filters.discount_type !== 'all') {
    query = query.eq('discount_type', filters.discount_type)
  }
  if (filters?.is_global && filters.is_global !== 'all') {
    query = query.eq('is_global', filters.is_global === 'global')
  }
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

const fetchCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, email')
    .eq('status', 'active')
    .order('name')
  
  if (error) throw error
  return data || []
}

const fetchAllowedCustomers = async (couponId) => {
  if (!couponId) return []
  
  const { data, error } = await supabase
    .from('coupon_allowed_customers')
    .select('customer_id, customers(id, name, phone, email)')
    .eq('coupon_id', couponId)
  
  if (error) throw error
  return data || []
}

const createCoupon = async ({ couponData, allowedCustomers, profile }) => {
  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .insert([{ ...couponData, created_by: profile?.id }])
    .select()
    .single()
  
  if (couponError) throw couponError
  
  if (!couponData.is_global && allowedCustomers?.length > 0) {
    const { error: customersError } = await supabase
      .from('coupon_allowed_customers')
      .insert(allowedCustomers.map(customerId => ({
        coupon_id: coupon.id,
        customer_id: customerId
      })))
    
    if (customersError) throw customersError
  }
  
  return coupon
}

const updateCoupon = async ({ id, couponData, allowedCustomers, profile }) => {
  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .update({ ...couponData, updated_by: profile?.id })
    .eq('id', id)
    .select()
    .single()
  
  if (couponError) throw couponError
  
  if (!couponData.is_global) {
    await supabase.from('coupon_allowed_customers').delete().eq('coupon_id', id)
    
    if (allowedCustomers?.length > 0) {
      const { error: customersError } = await supabase
        .from('coupon_allowed_customers')
        .insert(allowedCustomers.map(customerId => ({
          coupon_id: id,
          customer_id: customerId
        })))
      
      if (customersError) throw customersError
    }
  }
  
  return coupon
}

const deleteCoupon = async (id) => {
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw error
  return id
}

const toggleCouponStatus = async ({ id, currentStatus, profile }) => {
  const newStatus = !currentStatus
  const { data, error } = await supabase
    .from('coupons')
    .update({ is_active: newStatus, updated_by: profile?.id })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

const addAllowedCustomer = async ({ couponId, customer }) => {
  const { error } = await supabase
    .from('coupon_allowed_customers')
    .insert([{ coupon_id: couponId, customer_id: customer.id }])
  
  if (error) throw error
  return { customer_id: customer.id, customers: customer }
}

const removeAllowedCustomer = async ({ couponId, customerId }) => {
  const { error } = await supabase
    .from('coupon_allowed_customers')
    .delete()
    .eq('coupon_id', couponId)
    .eq('customer_id', customerId)
  
  if (error) throw error
  return customerId
}

// ============= Componente Principal =============
const Coupons = () => {
  const { profile } = useAuth()
  const { logError } = useSystemLogs()
  const { logComponentAction, logComponentError, logCreate, logUpdate, logDelete } = useLogger('Coupons')
  const { invalidateQueries } = useReactQuery()
  
  // Estado local
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', discount_type: 'percent',
    discount_value: '', max_discount: '', min_purchase: '0',
    is_global: true, is_active: true, valid_from: '', valid_to: '', usage_limit: ''
  })

  // ============= Queries =============
  const { 
    data: coupons = [], 
    isLoading: isLoadingCoupons,
    error: couponsError,
    refetch: refetchCoupons,
    isFetching: isFetchingCoupons
  } = useQuery({
    queryKey: ['coupons', { searchTerm, filters }],
    queryFn: fetchCoupons,
    staleTime: 2 * 60 * 1000,
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-active'],
    queryFn: fetchCustomers,
    staleTime: 5 * 60 * 1000,
  })

  const { 
    data: allowedCustomers = [],
  } = useQuery({
    queryKey: ['allowed-customers', editingCoupon?.id],
    queryFn: () => fetchAllowedCustomers(editingCoupon?.id),
    enabled: !!editingCoupon?.id && !editingCoupon?.is_global,
  })

  // ============= Mutations =============
  const createMutation = useMutation({
    mutationFn: createCoupon,
    onSuccess: async (coupon) => {
      await logCreate('coupon', coupon.id, coupon)
      await invalidateQueries(['coupons'])
      showFeedback('success', `Cupom ${coupon.code} criado!`)
      setShowModal(false)
    },
    onError: async (error) => {
      showFeedback('error', `Erro ao criar: ${error.message}`)
      await logError('coupon', error, { action: 'create' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: updateCoupon,
    onSuccess: async (coupon) => {
      await logUpdate('coupon', coupon.id, editingCoupon, coupon)
      await invalidateQueries(['coupons'])
      showFeedback('success', `Cupom ${coupon.code} atualizado!`)
      setShowModal(false)
    },
    onError: async (error) => {
      showFeedback('error', `Erro ao atualizar: ${error.message}`)
      await logComponentError(error, { action: 'update_coupon' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCoupon,
    onSuccess: async (id, coupon) => {
      await logDelete('coupon', id, coupon)
      await invalidateQueries(['coupons'])
      showFeedback('success', `Cupom ${coupon.code} excluído!`)
    },
    onError: (error) => {
      showFeedback('error', `Erro ao excluir: ${error.message}`)
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: toggleCouponStatus,
    onSuccess: async (coupon) => {
      await logUpdate('coupon', coupon.id, { is_active: !coupon.is_active }, coupon)
      await invalidateQueries(['coupons'])
      showFeedback('success', `Cupom ${coupon.is_active ? 'ativado' : 'desativado'}!`)
    },
    onError: (error) => {
      showFeedback('error', `Erro ao alterar status: ${error.message}`)
    }
  })

  const addCustomerMutation = useMutation({
    mutationFn: addAllowedCustomer,
    onSuccess: () => {
      invalidateQueries(['allowed-customers', selectedCoupon?.id])
      showFeedback('success', 'Cliente adicionado!')
    }
  })

  const removeCustomerMutation = useMutation({
    mutationFn: removeAllowedCustomer,
    onSuccess: () => {
      invalidateQueries(['allowed-customers', selectedCoupon?.id])
      showFeedback('success', 'Cliente removido!')
    }
  })

  // ============= Handlers =============
  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const handleOpenModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon)
      setFormData({
        code: coupon.code,
        name: coupon.name,
        description: coupon.description || '',
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        max_discount: coupon.max_discount || '',
        min_purchase: coupon.min_purchase || '0',
        is_global: coupon.is_global,
        is_active: coupon.is_active,
        valid_from: coupon.valid_from?.split('T')[0] || '',
        valid_to: coupon.valid_to?.split('T')[0] || '',
        usage_limit: coupon.usage_limit || ''
      })
      if (!coupon.is_global && allowedCustomers.length > 0) {
        setSelectedCustomers(allowedCustomers.map(ac => ac.customer_id))
      }
    } else {
      setEditingCoupon(null)
      setFormData({
        code: '', name: '', description: '', discount_type: 'percent',
        discount_value: '', max_discount: '', min_purchase: '0',
        is_global: true, is_active: true, valid_from: '', valid_to: '', usage_limit: ''
      })
      setSelectedCustomers([])
    }
    setShowModal(true)
  }

  const handleOpenCustomersModal = (coupon) => {
    setSelectedCoupon(coupon)
    setShowCustomersModal(true)
  }

  const handleSaveCoupon = () => {
    if (!formData.code || !formData.name || !formData.discount_value || formData.discount_value <= 0) {
      showFeedback('error', 'Preencha todos os campos obrigatórios')
      return
    }
    
    const couponData = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || null,
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
      min_purchase: parseFloat(formData.min_purchase) || 0,
      is_global: formData.is_global,
      is_active: formData.is_active,
      valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
      valid_to: formData.valid_to ? new Date(formData.valid_to).toISOString() : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
    }
    
    if (editingCoupon) {
      updateMutation.mutate({
        id: editingCoupon.id,
        couponData,
        allowedCustomers: selectedCustomers,
        profile
      })
    } else {
      createMutation.mutate({
        couponData,
        allowedCustomers: selectedCustomers,
        profile
      })
    }
  }

  const handleDeleteCoupon = (coupon) => {
    if (!confirm(`Excluir cupom ${coupon.code}?`)) return
    deleteMutation.mutate(coupon.id)
  }

  const handleToggleStatus = (coupon) => {
    toggleStatusMutation.mutate({
      id: coupon.id,
      currentStatus: coupon.is_active,
      profile
    })
  }

  const handleCopyCode = (code) => {
    navigator.clipboard?.writeText(code)
    showFeedback('success', `Código ${code} copiado!`)
  }

  const handleAddCustomer = (customer) => {
    if (!selectedCoupon) return
    addCustomerMutation.mutate({ couponId: selectedCoupon.id, customer })
  }

  const handleRemoveCustomer = (customerId) => {
    if (!selectedCoupon) return
    removeCustomerMutation.mutate({ couponId: selectedCoupon.id, customerId })
  }

  // ============= Render =============
  const isMutating = createMutation.isPending || updateMutation.isPending || 
                     deleteMutation.isPending || toggleStatusMutation.isPending

  // Log de acesso (apenas uma vez)
  React.useEffect(() => {
    logComponentAction('ACCESS_PAGE', null, { page: 'coupons' })
  }, [logComponentAction])

  if (couponsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar cupons</h2>
          <p className="text-gray-600 mb-4">{couponsError.message}</p>
          <Button onClick={() => refetchCoupons()} icon={RefreshCw}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (isLoadingCoupons && coupons.length === 0) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback({ show: false })} 
          />
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cupons de Desconto</h1>
              <p className="text-gray-500 mt-1">
                Gerencie cupons globais e restritos para seus clientes
                {isFetchingCoupons && <span className="ml-2 text-xs text-gray-400">atualizando...</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleOpenModal()} icon={Plus} disabled={isMutating}>
                Novo Cupom
              </Button>
            </div>
          </div>
        </div>

        <CouponStats coupons={coupons} />
        
        <CouponFilters 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          filters={filters} 
          setFilters={setFilters} 
        />

        <CouponTable
          coupons={coupons}
          onEdit={handleOpenModal}
          onManageCustomers={handleOpenCustomersModal}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteCoupon}
          onCopyCode={handleCopyCode}
        />

        <Modal 
          isOpen={showModal} 
          onClose={() => !isMutating && setShowModal(false)} 
          title={editingCoupon ? 'Editar Cupom' : 'Novo Cupom'} 
          size="lg"
        >
          <CouponForm
            formData={formData}
            setFormData={setFormData}
            isEditing={!!editingCoupon}
            customers={customers}
            selectedCustomers={selectedCustomers}
            setSelectedCustomers={setSelectedCustomers}
            disabled={isMutating}
          />
          <div className="flex gap-3 pt-4 mt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setShowModal(false)} 
              className="flex-1"
              disabled={isMutating}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveCoupon} 
              loading={createMutation.isPending || updateMutation.isPending} 
              className="flex-1"
            >
              {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
            </Button>
          </div>
        </Modal>

        <CouponCustomersModal
          isOpen={showCustomersModal}
          onClose={() => setShowCustomersModal(false)}
          coupon={selectedCoupon}
          allowedCustomers={allowedCustomers}
          setAllowedCustomers={() => {}}
          customers={customers}
          onAddCustomer={handleAddCustomer}
          onRemoveCustomer={handleRemoveCustomer}
          loading={addCustomerMutation.isPending || removeCustomerMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Coupons