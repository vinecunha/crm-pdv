// src/hooks/useCustomersHandlers.js
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@lib/supabase'
import { useSystemLogs } from '@hooks/useSystemLogs'

export const useCustomersHandlers = ({
  user,
  selectedCustomer,
  setSelectedCustomer,
  formData,
  setFormData,
  setFormErrors,
  setIsModalOpen,
  setIsDeleteModalOpen,
  setShowCampaignModal,
  setShowBirthdayConfirmModal,
  setCampaignLoading,
  createMutation,
  updateMutation,
  deleteMutation,
  showFeedback,
  logAction,
  logError
}) => {
  
  const navigate = useNavigate()

  const validateForm = useCallback(() => {
    const errors = {}
    
    if (!formData.name?.trim()) errors.name = 'Nome é obrigatório'
    else if (formData.name.length < 3) errors.name = 'Nome deve ter pelo menos 3 caracteres'
    
    if (!formData.email?.trim()) errors.email = 'E-mail é obrigatório'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'E-mail inválido'
    
    if (!formData.phone?.trim()) errors.phone = 'Telefone é obrigatório'
    
    if (formData.document && formData.document.replace(/\D/g, '').length < 11) errors.document = 'Documento inválido'
    if (formData.zip_code && formData.zip_code.replace(/\D/g, '').length < 8) errors.zip_code = 'CEP inválido'
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData, setFormErrors])

  const handleOpenModal = useCallback((customer = null) => {
    setSelectedCustomer(customer)
    setFormData(customer ? 
      { ...customer, status: customer.status || 'active' } : 
      { 
        name: '', email: '', phone: '', document: '', address: '',
        city: '', state: '', zip_code: '', birth_date: '', status: 'active' 
      }
    )
    setFormErrors({})
    setIsModalOpen(true)
  }, [setSelectedCustomer, setFormData, setFormErrors, setIsModalOpen])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedCustomer(null)
    setFormErrors({})
  }, [setIsModalOpen, setSelectedCustomer, setFormErrors])

  const handleSubmit = useCallback(() => {
    if (!validateForm()) return
    
    const customerData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.replace(/\D/g, ''),
      document: formData.document?.replace(/\D/g, '') || null,
      address: formData.address?.trim() || null,
      city: formData.city?.trim() || null,
      state: formData.state?.trim() || null,
      zip_code: formData.zip_code?.replace(/\D/g, '') || null,
      birth_date: formData.birth_date || null,
      status: formData.status || 'active'
    }

    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data: customerData })
    } else {
      createMutation.mutate(customerData)
    }
  }, [formData, selectedCustomer, validateForm, createMutation, updateMutation])

  const handleDeleteClick = useCallback((customer) => {
    setSelectedCustomer(customer)
    setIsDeleteModalOpen(true)
  }, [setSelectedCustomer, setIsDeleteModalOpen])

  const handleDelete = useCallback(() => {
    if (selectedCustomer) {
      deleteMutation.mutate(selectedCustomer.id)
    }
  }, [selectedCustomer, deleteMutation])

  const handleCloseDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false)
    setSelectedCustomer(null)
  }, [setIsDeleteModalOpen, setSelectedCustomer])

  const handleCommunicate = useCallback((customer) => {
    navigate(`/customers/${customer.id}/communication`)
  }, [navigate])

  const handleSendCampaign = useCallback((customer) => {
    setSelectedCustomer(customer)
    
    const today = new Date()
    const birth = customer.birth_date ? new Date(customer.birth_date) : null
    const isBirthday = birth && 
      birth.getMonth() === today.getMonth() && 
      birth.getDate() === today.getDate()
    
    if (isBirthday) {
      setShowBirthdayConfirmModal(true)
    } else {
      setShowCampaignModal(true)
    }
  }, [setSelectedCustomer, setShowBirthdayConfirmModal, setShowCampaignModal])

  const handleCloseCampaignModal = useCallback(() => {
    setShowCampaignModal(false)
    setSelectedCustomer(null)
  }, [setShowCampaignModal, setSelectedCustomer])

  const handleCloseBirthdayModal = useCallback(() => {
    setShowBirthdayConfirmModal(false)
    setSelectedCustomer(null)
  }, [setShowBirthdayConfirmModal, setSelectedCustomer])

  const handleSendBirthdayCampaign = useCallback(async () => {
    if (!selectedCustomer) return
    
    setCampaignLoading(true)
    try {
      const { data: birthdayCoupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', 'ANIVERSARIO')
        .single()
      
      let couponId = birthdayCoupon?.id
      
      if (!birthdayCoupon) {
        const { data: newCoupon } = await supabase
          .from('coupons')
          .insert({
            code: 'ANIVERSARIO',
            name: 'Cupom de Aniversário',
            description: '10% de desconto para aniversariantes',
            discount_type: 'percent',
            discount_value: 10,
            max_discount: 50,
            min_purchase: 50,
            is_global: false,
            is_active: true,
            usage_limit: 1,
            valid_from: new Date().toISOString(),
            valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: user?.id
          })
          .select()
          .single()
        
        couponId = newCoupon?.id
      }
      
      if (couponId) {
        await supabase
          .from('coupon_allowed_customers')
          .upsert({
            coupon_id: couponId,
            customer_id: selectedCustomer.id
          }, { onConflict: 'coupon_id,customer_id' })
      }
      
      await supabase
        .from('customer_communications')
        .insert({
          customer_id: selectedCustomer.id,
          channel: 'whatsapp',
          subject: 'Feliz Aniversário! 🎉',
          content: `Olá ${selectedCustomer.name}, feliz aniversário! 🎂\n\nComo presente, você ganhou um cupom de 10% OFF para usar em sua próxima compra!\n\nCupom: ANIVERSARIO\nValidade: 30 dias\n\nAproveite!`,
          status: 'sent',
          sent_by: user?.id
        })
      
      await supabase.rpc('create_notification', {
        p_user_id: user?.id,
        p_title: '🎂 Campanha de Aniversário',
        p_message: `Cupom ANIVERSARIO enviado para ${selectedCustomer.name}`,
        p_type: 'success',
        p_entity_type: 'customer',
        p_entity_id: selectedCustomer.id.toString()
      })
      
      await logAction({
        action: 'SEND_BIRTHDAY_CAMPAIGN',
        entityType: 'customer',
        entityId: selectedCustomer.id,
        details: { 
          customer_name: selectedCustomer.name, 
          coupon: 'ANIVERSARIO' 
        }
      })
      
      showFeedback('success', `🎉 Campanha de aniversário enviada para ${selectedCustomer.name}!`)
      
    } catch (error) {
      console.error('Erro ao enviar campanha de aniversário:', error)
      showFeedback('error', 'Erro ao enviar campanha: ' + error.message)
      await logError('customer', error, { action: 'send_birthday_campaign' })
    } finally {
      setCampaignLoading(false)
      setShowBirthdayConfirmModal(false)
      setSelectedCustomer(null)
    }
  }, [selectedCustomer, user, showFeedback, logAction, logError, setCampaignLoading, setShowBirthdayConfirmModal, setSelectedCustomer])

  const handleSendCustomCampaign = useCallback(async (message, couponCode) => {
    if (!selectedCustomer) return
    
    setCampaignLoading(true)
    try {
      if (couponCode) {
        const { data: coupon } = await supabase
          .from('coupons')
          .select('id')
          .eq('code', couponCode)
          .single()
        
        if (coupon) {
          await supabase
            .from('coupon_allowed_customers')
            .upsert({
              coupon_id: coupon.id,
              customer_id: selectedCustomer.id
            }, { onConflict: 'coupon_id,customer_id' })
        }
      }
      
      await supabase
        .from('customer_communications')
        .insert({
          customer_id: selectedCustomer.id,
          channel: 'whatsapp',
          subject: 'Oferta Especial 💙',
          content: message,
          status: 'sent',
          sent_by: user?.id
        })
      
      await supabase.rpc('create_notification', {
        p_user_id: user?.id,
        p_title: '📧 Campanha Enviada',
        p_message: `Campanha enviada para ${selectedCustomer.name}`,
        p_type: 'success',
        p_entity_type: 'customer',
        p_entity_id: selectedCustomer.id.toString()
      })
      
      await logAction({
        action: 'SEND_CAMPAIGN',
        entityType: 'customer',
        entityId: selectedCustomer.id,
        details: { 
          customer_name: selectedCustomer.name, 
          coupon: couponCode || 'nenhum' 
        }
      })
      
      showFeedback('success', `✅ Campanha enviada para ${selectedCustomer.name}!`)
      
    } catch (error) {
      console.error('Erro ao enviar campanha:', error)
      showFeedback('error', 'Erro ao enviar campanha: ' + error.message)
      await logError('customer', error, { action: 'send_campaign' })
    } finally {
      setCampaignLoading(false)
      setShowCampaignModal(false)
      setSelectedCustomer(null)
    }
  }, [selectedCustomer, user, showFeedback, logAction, logError, setCampaignLoading, setShowCampaignModal, setSelectedCustomer])

  return {
    validateForm,
    handleOpenModal,
    handleCloseModal,
    handleSubmit,
    handleDeleteClick,
    handleDelete,
    handleCloseDeleteModal,
    handleCommunicate,
    handleSendCampaign,
    handleCloseCampaignModal,
    handleCloseBirthdayModal,
    handleSendBirthdayCampaign,
    handleSendCustomCampaign
  }
}