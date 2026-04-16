// src/pages/Customers.jsx
import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, RefreshCw } from '../lib/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useReactQuery } from '../hooks/useReactQuery'
import useSystemLogs from '../hooks/useSystemLogs'
import { supabase } from '../lib/supabase'

import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import ConfirmModal from '../components/ui/ConfirmModal'
import CampaignModal from '../components/customers/CampaignModal'
import RFVLegend from '../components/customers/RFVLegend'

import CustomerForm from '../components/customers/CustomerForm'
import CustomerDeleteModal from '../components/customers/CustomerDeleteModal'
import CustomerTable from '../components/customers/CustomerTable'
import CustomerFilters from '../components/customers/CustomerFilters'

import * as customerService from '../services/customerService'

const Customers = () => {
  const { profile, user } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { invalidateQueries } = useReactQuery()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', document: '', address: '',
    city: '', state: '', zip_code: '', birth_date: '', status: 'active'
  })
  const [formErrors, setFormErrors] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })

  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showBirthdayConfirmModal, setShowBirthdayConfirmModal] = useState(false)
  const [campaignLoading, setCampaignLoading] = useState(false)

  const { 
    data: customers = [], 
    isLoading,
    error: customersError,
    refetch: refetchCustomers,
    isFetching
  } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.fetchCustomers,
    staleTime: 0,
    refetchOnMount: true,
  })

  const filteredCustomers = useMemo(() => {
    const customersArray = Array.isArray(customers) ? customers : []
    let filtered = [...customersArray]
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(search) || 
        c.email?.toLowerCase().includes(search) || 
        c.phone?.includes(search)
      )
    }
    
    if (activeFilters.status) {
      filtered = filtered.filter(c => c.status === activeFilters.status)
    }
    
    if (activeFilters.city) {
      filtered = filtered.filter(c => 
        c.city?.toLowerCase().includes(activeFilters.city.toLowerCase())
      )
    }
    
    return filtered
  }, [customers, searchTerm, activeFilters])

  const createMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: async (data) => {
      await logCreate('customer', data.id, data)
      await invalidateQueries(['customers'])
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      showFeedback('success', 'Cliente cadastrado com sucesso!')
      setIsModalOpen(false)
    },
    onError: async (error) => {
      showFeedback('error', error.message)
      await logError('customer', error, { action: 'create' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customerService.updateCustomer(id, data),
    onSuccess: async (data) => {
      await logUpdate('customer', data.id, selectedCustomer, data)
      await invalidateQueries(['customers'])
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      showFeedback('success', 'Cliente atualizado com sucesso!')
      setIsModalOpen(false)
    },
    onError: async (error) => {
      showFeedback('error', error.message)
      await logError('customer', error, { action: 'update' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: async (id) => {
      await logDelete('customer', id, selectedCustomer)
      await invalidateQueries(['customers'])
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      showFeedback('success', 'Cliente excluído!')
      setIsDeleteModalOpen(false)
    },
    onError: async (error) => {
      showFeedback('error', error.message)
      await logError('customer', error, { action: 'delete' })
    }
  })

  React.useEffect(() => {
    logAction({ 
      action: 'VIEW', 
      entityType: 'customer', 
      details: { user_role: profile?.role } 
    })
  }, [])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const validateForm = () => {
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
  }

  const handleOpenModal = (customer = null) => {
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
  }

  const handleSubmit = () => {
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
  }

  const handleDelete = () => {
    deleteMutation.mutate(selectedCustomer.id)
  }

  const handleSendCampaign = (customer) => {
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
  }

  const handleSendBirthdayCampaign = async () => {
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
  }

  const handleSendCustomCampaign = async (message, couponCode) => {
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
  }

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  if (customersError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar clientes</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{customersError.message}</p>
          <Button onClick={() => refetchCustomers()} icon={RefreshCw}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (isLoading) return <DataLoadingSkeleton />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gerencie seus clientes cadastrados ({customers.length})
              {isFetching && (
                <span className="ml-2 inline-flex items-center text-xs text-gray-400 dark:text-gray-500">
                  <RefreshCw size={12} className="animate-spin mr-1" />
                  Atualizando...
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <RFVLegend />
            <Button onClick={() => handleOpenModal()} icon={UserPlus} disabled={isMutating}>
              Novo Cliente
            </Button>
          </div>
        </div>

        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback({ show: false })} 
          />
        )}

        <div className="mb-6">
          <CustomerFilters 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            onFilterChange={setActiveFilters} 
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <DataEmptyState 
            title="Nenhum cliente encontrado" 
            description={searchTerm ? "Tente buscar por outro termo" : "Comece cadastrando seu primeiro cliente"} 
            action={<Button onClick={() => handleOpenModal()} disabled={isMutating}>Cadastrar Cliente</Button>} 
          />
        ) : (
          <CustomerTable 
            customers={filteredCustomers} 
            onEdit={handleOpenModal} 
            onDelete={(c) => { setSelectedCustomer(c); setIsDeleteModalOpen(true) }} 
            onCommunicate={(c) => navigate(`/customers/${c.id}/communication`)} 
            onSendCampaign={handleSendCampaign}
          />
        )}

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => !isMutating && setIsModalOpen(false)} 
          title={selectedCustomer ? 'Editar Cliente' : 'Novo Cliente'} 
          size="lg"
        >
          <CustomerForm 
            formData={formData} 
            formErrors={formErrors} 
            onChange={(e) => { 
              const { name, value } = e.target
              setFormData(prev => ({ ...prev, [name]: value })) 
            }} 
            onSubmit={handleSubmit} 
            onCancel={() => setIsModalOpen(false)} 
            isSubmitting={createMutation.isPending || updateMutation.isPending} 
            isEditing={!!selectedCustomer} 
          />
        </Modal>

        <CustomerDeleteModal 
          isOpen={isDeleteModalOpen} 
          onClose={() => setIsDeleteModalOpen(false)} 
          customer={selectedCustomer} 
          onConfirm={handleDelete} 
          isSubmitting={deleteMutation.isPending} 
        />

        <ConfirmModal
          isOpen={showBirthdayConfirmModal}
          onClose={() => {
            setShowBirthdayConfirmModal(false)
            setSelectedCustomer(null)
          }}
          onConfirm={handleSendBirthdayCampaign}
          title="🎂 Campanha de Aniversário"
          message={
            <div className="space-y-2">
              <p className="dark:text-gray-300">Deseja enviar um cupom de <strong>10% OFF</strong> para <strong>{selectedCustomer?.name}</strong>?</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                O cliente receberá o cupom <strong>ANIVERSARIO</strong> válido por 30 dias.
              </p>
            </div>
          }
          confirmText="Enviar Cupom"
          cancelText="Cancelar"
          variant="success"
          loading={campaignLoading}
        />

        <CampaignModal
          isOpen={showCampaignModal}
          onClose={() => {
            setShowCampaignModal(false)
            setSelectedCustomer(null)
          }}
          onSend={handleSendCustomCampaign}
          customer={selectedCustomer}
          loading={campaignLoading}
        />
      </div>
    </div>
  )
}

export default Customers