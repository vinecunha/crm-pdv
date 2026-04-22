// src/hooks/useCouponsHandlers.js
import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import logger from '@utils/logger'

export const useCouponsHandlers = ({
  profile,
  user,
  editingCoupon,
  setEditingCoupon,
  formData,
  setFormData,
  selectedCustomers,
  setSelectedCustomers,
  selectedCoupon,
  setSelectedCoupon,
  selectedCouponForCampaign,
  setSelectedCouponForCampaign,
  couponToDelete,
  setCouponToDelete,
  allowedCustomers,
  setShowModal,
  setShowCustomersModal,
  setShowCampaignModal,
  setShowDeleteConfirmModal,
  createMutation,
  updateMutation,
  deleteMutation,
  toggleStatusMutation,
  addCustomerMutation,
  removeCustomerMutation,
  showFeedback
}) => {
  
  const queryClient = useQueryClient()

  const handleOpenModal = useCallback((coupon = null) => {
    logger.log('📝 [Coupons] Abrindo modal', { isEditing: !!coupon, couponCode: coupon?.code })
    
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
  }, [allowedCustomers, setEditingCoupon, setFormData, setSelectedCustomers, setShowModal])

  const handleOpenCustomersModal = useCallback((coupon) => {
    logger.log('👥 [Coupons] Abrindo modal de clientes', { couponCode: coupon?.code })
    setSelectedCoupon(coupon)
    setShowCustomersModal(true)
  }, [setSelectedCoupon, setShowCustomersModal])

  const handleOpenCampaignModal = useCallback((coupon) => {
    logger.log('📢 [Coupons] Abrindo modal de campanha', { couponCode: coupon?.code })
    setSelectedCouponForCampaign(coupon)
    setShowCampaignModal(true)
  }, [setSelectedCouponForCampaign, setShowCampaignModal])

  const handleSaveCoupon = useCallback(() => {
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
  }, [formData, editingCoupon, selectedCustomers, createMutation, updateMutation, showFeedback])

  const handleDeleteCoupon = useCallback((coupon) => {
    logger.log('🗑️ [Coupons] handleDeleteCoupon chamado', { id: coupon?.id, code: coupon?.code })
    
    if (!coupon || !coupon.id) {
      logger.error('❌ [Coupons] Cupom inválido', { coupon })
      return
    }
    
    setCouponToDelete(coupon)
    setShowDeleteConfirmModal(true)
  }, [setCouponToDelete, setShowDeleteConfirmModal])

  const handleConfirmDelete = useCallback(() => {
    logger.log('✅ [Coupons] Exclusão confirmada', { id: couponToDelete?.id, code: couponToDelete?.code })
    deleteMutation.mutate(couponToDelete.id)
  }, [couponToDelete, deleteMutation])

  const handleCancelDelete = useCallback(() => {
    logger.log('❌ [Coupons] Exclusão cancelada')
    setShowDeleteConfirmModal(false)
    setCouponToDelete(null)
  }, [setShowDeleteConfirmModal, setCouponToDelete])

  const handleToggleStatus = useCallback((coupon) => {
    logger.log('🔘 [Coupons] Toggle status', { id: coupon.id, current: coupon.is_active })
    toggleStatusMutation.mutate({ id: coupon.id, currentStatus: coupon.is_active })
  }, [toggleStatusMutation])

  const handleCopyCode = useCallback((code) => {
    logger.log('📋 [Coupons] Copiando código', { code })
    navigator.clipboard?.writeText(code)
    showFeedback('success', `Código ${code} copiado!`)
  }, [showFeedback])

  const handleAddCustomer = useCallback((customer) => {
    if (!selectedCoupon) return
    logger.log('➕ [Coupons] Adicionando cliente', { customerId: customer.id, couponId: selectedCoupon.id })
    addCustomerMutation.mutate({ couponId: selectedCoupon.id, customer })
  }, [selectedCoupon, addCustomerMutation])

  const handleRemoveCustomer = useCallback((customerId) => {
    if (!selectedCoupon) return
    logger.log('➖ [Coupons] Removendo cliente', { customerId, couponId: selectedCoupon.id })
    removeCustomerMutation.mutate({ couponId: selectedCoupon.id, customerId })
  }, [selectedCoupon, removeCustomerMutation])

  const handleSendCampaign = useCallback(async (message, couponCode, channel) => {
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
          window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank')
        } else {
          showFeedback('error', 'Cliente não possui telefone cadastrado')
          return
        }
      }
      
      if (channel === 'email') {
        const email = customer.email
        if (email) {
          window.location.href = `mailto:${email}?subject=Oferta Especial&body=${encodeURIComponent(message)}`
        } else {
          showFeedback('error', 'Cliente não possui email cadastrado')
          return
        }
      }
      
      if (channel === 'sms') {
        const phone = customer.phone?.replace(/\D/g, '')
        if (phone) {
          window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`
        } else {
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
    }
  }, [selectedCouponForCampaign, user, showFeedback, setShowCampaignModal, setSelectedCouponForCampaign])

  const closeModal = useCallback(() => {
    setShowModal(false)
    setEditingCoupon(null)
  }, [setShowModal, setEditingCoupon])

  const closeCustomersModal = useCallback(() => {
    setShowCustomersModal(false)
    setSelectedCoupon(null)
  }, [setShowCustomersModal, setSelectedCoupon])

  const closeCampaignModal = useCallback(() => {
    setShowCampaignModal(false)
    setSelectedCouponForCampaign(null)
  }, [setShowCampaignModal, setSelectedCouponForCampaign])

  return {
    handleOpenModal,
    handleOpenCustomersModal,
    handleOpenCampaignModal,
    handleSaveCoupon,
    handleDeleteCoupon,
    handleConfirmDelete,
    handleCancelDelete,
    handleToggleStatus,
    handleCopyCode,
    handleAddCustomer,
    handleRemoveCustomer,
    handleSendCampaign,
    closeModal,
    closeCustomersModal,
    closeCampaignModal
  }
}