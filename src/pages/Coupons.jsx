// src/pages/Coupons.jsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Send } from '../lib/icons'
import { useAuth } from '../contexts/AuthContext'
import { useReactQuery } from '../hooks/useReactQuery'
import useSystemLogs from '../hooks/useSystemLogs'
import useLogger from '../hooks/useLogger'
import logger from '../utils/logger' 
import { supabase } from '../lib/supabase'

import * as couponService from '../services/couponService'

import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import ConfirmModal from '../components/ui/ConfirmModal'

import CouponStats from '../components/coupons/CouponStats'
import CouponForm from '../components/coupons/CouponForm'
import CouponTable from '../components/coupons/CouponTable'
import CouponFilters from '../components/coupons/CouponFilters'
import CouponCustomersModal from '../components/coupons/CouponCustomersModal'
import CouponCampaignModal from '../components/coupons/CouponCampaignModal'

const Coupons = () => {
  const { profile, user } = useAuth()
  const { logError } = useSystemLogs()
  const { logComponentAction, logComponentError, logCreate, logUpdate, logDelete } = useLogger('Coupons')
  const { invalidateQueries } = useReactQuery()
  const queryClient = useQueryClient() 
  const [campaignLoading, setCampaignLoading] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false) 
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [selectedCouponForCampaign, setSelectedCouponForCampaign] = useState(null)
  const [couponToDelete, setCouponToDelete] = useState(null) 
  const [selectedCustomers, setSelectedCustomers] = useState([])
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', discount_type: 'percent',
    discount_value: '', max_discount: '', min_purchase: '0',
    is_global: true, is_active: true, valid_from: '', valid_to: '', usage_limit: ''
  })

  const { 
    data: coupons = [], 
    isLoading: isLoadingCoupons,
    error: couponsError,
    refetch: refetchCoupons,
    isFetching: isFetchingCoupons
  } = useQuery({
    queryKey: ['coupons', { searchTerm, filters }],
    queryFn: () => couponService.fetchCoupons(searchTerm, filters),
    staleTime: 0,                    
    gcTime: 0,                       
    cacheTime: 0,                    
    refetchOnMount: true,            
    refetchOnWindowFocus: true,      
    refetchOnReconnect: true,        
    retry: 1,     
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['customers-active'],
    queryFn: couponService.fetchCustomers,
    staleTime: 5 * 60 * 1000,
  })

  const { data: allowedCustomers = [] } = useQuery({
    queryKey: ['allowed-customers', editingCoupon?.id],
    queryFn: () => couponService.fetchAllowedCustomers(editingCoupon?.id),
    enabled: !!editingCoupon?.id && !editingCoupon?.is_global,
  })

  const createMutation = useMutation({
    mutationFn: ({ couponData, allowedCustomers }) => couponService.createCoupon(couponData, allowedCustomers, profile),
    onSuccess: async (coupon) => {
      logger.log('✅ [Coupons] Cupom criado', { id: coupon.id, code: coupon.code })
      await logCreate('coupon', coupon.id, coupon)
      await invalidateQueries(['coupons'])
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      showFeedback('success', `Cupom ${coupon.code} criado!`)
      setShowModal(false)
    },
    onError: async (error) => { 
      logger.error('❌ [Coupons] Erro ao criar cupom', { error: error.message })
      showFeedback('error', `Erro ao criar: ${error.message}`)
      await logError('coupon', error, { action: 'create' }) 
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, couponData, allowedCustomers }) => couponService.updateCoupon(id, couponData, allowedCustomers, profile),
    onSuccess: async (coupon) => {
      logger.log('✅ [Coupons] Cupom atualizado', { id: coupon.id, code: coupon.code })
      await logUpdate('coupon', coupon.id, editingCoupon, coupon)
      await invalidateQueries(['coupons'])
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      showFeedback('success', `Cupom ${coupon.code} atualizado!`)
      setShowModal(false)
    },
    onError: async (error) => { 
      logger.error('❌ [Coupons] Erro ao atualizar cupom', { error: error.message })
      showFeedback('error', `Erro ao atualizar: ${error.message}`)
      await logComponentError(error, { action: 'update_coupon' }) 
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => {
      logger.log('🔄 [Coupons] deleteMutation.mutationFn', { id })
      return couponService.deleteCoupon(id)
    },
    onSuccess: async (data, id) => {
      logger.log('✅ [Coupons] deleteMutation.onSuccess', { id, data })
      await logDelete('coupon', id, couponToDelete)
      await invalidateQueries(['coupons'])
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      showFeedback('success', `Cupom ${couponToDelete?.code || 'excluído'}!`)
      setShowDeleteConfirmModal(false)
      setCouponToDelete(null)
    },
    onError: (error) => {
      logger.error('❌ [Coupons] deleteMutation.onError', { error: error.message })
      showFeedback('error', `Erro ao excluir: ${error.message}`)
      setShowDeleteConfirmModal(false)
      setCouponToDelete(null)
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }) => couponService.toggleCouponStatus(id, currentStatus, profile),
    onSuccess: async (coupon) => {
      logger.log('🔘 [Coupons] Status alterado', { id: coupon.id, is_active: coupon.is_active })
      await logUpdate('coupon', coupon.id, { is_active: !coupon.is_active }, coupon)
      await invalidateQueries(['coupons'])
      showFeedback('success', `Cupom ${coupon.is_active ? 'ativado' : 'desativado'}!`)
    },
    onError: (error) => {
      logger.error('❌ [Coupons] Erro ao alterar status', { error: error.message })
      showFeedback('error', `Erro ao alterar status: ${error.message}`)
    }
  })

  const addCustomerMutation = useMutation({
    mutationFn: ({ couponId, customer }) => couponService.addAllowedCustomer(couponId, customer),
    onSuccess: () => { 
      logger.log('✅ [Coupons] Cliente adicionado ao cupom')
      queryClient.invalidateQueries({ queryKey: ['allowed-customers', selectedCoupon?.id] })
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      showFeedback('success', 'Cliente adicionado!') 
    },
    onError: (error) => {
      logger.error('❌ [Coupons] Erro ao adicionar cliente', { error: error.message })
      showFeedback('error', `Erro ao adicionar: ${error.message}`)
    }
  })

  const removeCustomerMutation = useMutation({
    mutationFn: ({ couponId, customerId }) => couponService.removeAllowedCustomer(couponId, customerId),
    onSuccess: () => { 
      logger.log('✅ [Coupons] Cliente removido do cupom')
      queryClient.invalidateQueries({ queryKey: ['allowed-customers', selectedCoupon?.id] })
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      showFeedback('success', 'Cliente removido!') 
    },
    onError: (error) => {
      logger.error('❌ [Coupons] Erro ao remover cliente', { error: error.message })
      showFeedback('error', `Erro ao remover: ${error.message}`)
    }
  })

  const showFeedback = (type, message) => { 
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000) 
  }

  const handleOpenModal = (coupon = null) => {
    logger.log('📝 [Coupons] Abrindo modal', { isEditing: !!coupon, couponCode: coupon?.code })
    if (coupon) {
      setEditingCoupon(coupon)
      setFormData({
        code: coupon.code, name: coupon.name, description: coupon.description || '',
        discount_type: coupon.discount_type, discount_value: coupon.discount_value,
        max_discount: coupon.max_discount || '', min_purchase: coupon.min_purchase || '0',
        is_global: coupon.is_global, is_active: coupon.is_active,
        valid_from: coupon.valid_from?.split('T')[0] || '', valid_to: coupon.valid_to?.split('T')[0] || '',
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
    logger.log('👥 [Coupons] Abrindo modal de clientes', { couponCode: coupon?.code })
    setSelectedCoupon(coupon)
    setShowCustomersModal(true) 
  }

  const handleOpenCampaignModal = (coupon) => {
    logger.log('📢 [Coupons] Abrindo modal de campanha', { couponCode: coupon?.code })
    setSelectedCouponForCampaign(coupon)
    setShowCampaignModal(true)
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
      updateMutation.mutate({ id: editingCoupon.id, couponData, allowedCustomers: selectedCustomers })
    } else {
      createMutation.mutate({ couponData, allowedCustomers: selectedCustomers })
    }
  }

  const handleDeleteCoupon = (coupon) => {
    logger.log('🗑️ [Coupons] handleDeleteCoupon chamado', {
      id: coupon?.id,
      code: coupon?.code,
      name: coupon?.name
    })
    
    if (!coupon || !coupon.id) {
      logger.error('❌ [Coupons] Cupom inválido', { coupon })
      return
    }
    
    setCouponToDelete(coupon)
    setShowDeleteConfirmModal(true)
  }

  const handleConfirmDelete = () => {
    logger.log('✅ [Coupons] Exclusão confirmada', {
      id: couponToDelete?.id,
      code: couponToDelete?.code
    })
    deleteMutation.mutate(couponToDelete.id)
  }

  const handleCancelDelete = () => {
    logger.log('❌ [Coupons] Exclusão cancelada')
    setShowDeleteConfirmModal(false)
    setCouponToDelete(null)
  }

  const handleToggleStatus = (coupon) => {
    logger.log('🔘 [Coupons] Toggle status', { id: coupon.id, current: coupon.is_active })
    toggleStatusMutation.mutate({ id: coupon.id, currentStatus: coupon.is_active })
  }

  const handleCopyCode = (code) => { 
    logger.log('📋 [Coupons] Copiando código', { code })
    navigator.clipboard?.writeText(code)
    showFeedback('success', `Código ${code} copiado!`) 
  }

  const handleAddCustomer = (customer) => { 
    if (!selectedCoupon) return
    logger.log('➕ [Coupons] Adicionando cliente', { customerId: customer.id, couponId: selectedCoupon.id })
    addCustomerMutation.mutate({ couponId: selectedCoupon.id, customer }) 
  }

  const handleRemoveCustomer = (customerId) => { 
    if (!selectedCoupon) return
    logger.log('➖ [Coupons] Removendo cliente', { customerId, couponId: selectedCoupon.id })
    removeCustomerMutation.mutate({ couponId: selectedCoupon.id, customerId }) 
  }

  const handleSendCustomCampaign = async (message, couponCode, channel) => {
    logger.log('📧 [Coupons] Enviando campanha', { 
      customer: selectedCouponForCampaign?.name, 
      couponCode, 
      channel 
    })
    
    const customer = selectedCouponForCampaign
    
    if (!customer) {
      logger.error('❌ [Coupons] Cliente não selecionado')
      showFeedback('error', 'Cliente não selecionado')
      return
    }
    
    setCampaignLoading?.(true)
    
    try {
      const { error: commError } = await supabase
        .from('customer_communications')
        .insert({
          customer_id: customer.id,
          channel: channel,
          subject: channel === 'whatsapp' ? 'Campanha WhatsApp' : 'Campanha',
          content: message,
          status: 'sent',
          sent_by: user?.id
        })
      
      if (commError) {
        logger.error('❌ [Coupons] Erro ao registrar comunicação', { error: commError.message })
      }
      
      if (channel === 'whatsapp') {
        const phone = customer.phone?.replace(/\D/g, '')
        if (phone) {
          const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`
          logger.log('📱 [Coupons] Abrindo WhatsApp', { phone })
          window.open(whatsappUrl, '_blank')
        } else {
          logger.error('❌ [Coupons] Telefone não encontrado')
          showFeedback('error', 'Cliente não possui telefone cadastrado')
          return
        }
      }
      
      if (channel === 'email') {
        const email = customer.email
        if (email) {
          const mailtoUrl = `mailto:${email}?subject=Oferta Especial&body=${encodeURIComponent(message)}`
          logger.log('📧 [Coupons] Abrindo Email', { email })
          window.location.href = mailtoUrl
        } else {
          logger.error('❌ [Coupons] Email não encontrado')
          showFeedback('error', 'Cliente não possui email cadastrado')
          return
        }
      }
      
      if (channel === 'sms') {
        const phone = customer.phone?.replace(/\D/g, '')
        if (phone) {
          const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`
          logger.log('💬 [Coupons] Abrindo SMS', { phone })
          window.location.href = smsUrl
        } else {
          logger.error('❌ [Coupons] Telefone não encontrado')
          showFeedback('error', 'Cliente não possui telefone cadastrado')
          return
        }
      }
      
      await supabase.rpc('create_notification', {
        p_user_id: user?.id,
        p_title: '📧 Campanha Enviada',
        p_message: `Campanha enviada para ${customer.name} via ${channel}`,
        p_type: 'success',
        p_entity_type: 'customer',
        p_entity_id: customer.id.toString()
      })
      
      showFeedback('success', `✅ Campanha enviada para ${customer.name} via ${channel}!`)
      setShowCampaignModal(false)
      setSelectedCouponForCampaign(null)
      
    } catch (error) {
      logger.error('❌ [Coupons] Erro ao enviar campanha', { error: error.message })
      showFeedback('error', `Erro ao enviar: ${error.message}`)
    } finally {
      setCampaignLoading?.(false)
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || toggleStatusMutation.isPending

  React.useEffect(() => { 
    logger.log('📄 [Coupons] Página acessada', { user_role: profile?.role })
    logComponentAction('ACCESS_PAGE', null, { page: 'coupons' }) 
  }, [])

  if (couponsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar cupons</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{couponsError.message}</p>
          <Button onClick={() => refetchCoupons()} icon={RefreshCw}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (isLoadingCoupons && coupons.length === 0) {
    return <DataLoadingSkeleton />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cupons de Desconto</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Gerencie cupons globais e restritos para seus clientes
                {isFetchingCoupons && (
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">atualizando...</span>
                )}
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
          onSendCampaign={handleOpenCampaignModal}
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
          <div className="flex gap-3 pt-4 mt-4 border-t dark:border-gray-700">
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

        <CouponCampaignModal
          isOpen={showCampaignModal}
          onClose={() => {
            setShowCampaignModal(false)
            setSelectedCouponForCampaign(null)
          }}
          coupon={selectedCouponForCampaign}
          onSuccess={(result) => {
            showFeedback('success', `✅ Campanha enviada para ${result.successCount} cliente(s)!`)
            queryClient.invalidateQueries({ queryKey: ['coupons'] })
          }}
        />

        <ConfirmModal
          isOpen={showDeleteConfirmModal}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Confirmar Exclusão"
          message={
            <div className="space-y-2">
              <p className="dark:text-gray-300">Tem certeza que deseja excluir o cupom <strong>{couponToDelete?.code}</strong>?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Esta ação não pode ser desfeita.</p>
            </div>
          }
          confirmText="Excluir"
          cancelText="Cancelar"
          variant="danger"
          loading={deleteMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Coupons