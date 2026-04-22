// src/pages/Customers.jsx
import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, RefreshCw, Users as UsersIcon } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import { useReactQuery } from '@hooks/useReactQuery'
import { useSystemLogs } from '@hooks/useSystemLogs'
import useMediaQuery from '@hooks/useMediaQuery'

import Button from '@components/ui/Button'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import DataEmptyState from '@components/ui/DataEmptyState'
import PageHeader from '@components/ui/PageHeader'
import DataCards from '@components/ui/DataCards'
import CustomerCard from '@components/customers/CustomerCard'

import RFVLegend from '@components/customers/RFVLegend'
import CustomerTable from '@components/customers/CustomerTable'
import CustomerFilters from '@components/customers/CustomerFilters'
import CustomersModalsContainer from '@components/customers/CustomersModalsContainer'

import { useCustomersHandlers } from '@/hooks/handlers'
import * as customerService from '@services/customerService'

const Customers = () => {
  const { profile, user } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  const queryClient = useQueryClient()
  const { invalidateQueries } = useReactQuery()
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  const [viewMode] = useState('auto')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showBirthdayConfirmModal, setShowBirthdayConfirmModal] = useState(false)
  const [campaignLoading, setCampaignLoading] = useState(false)
  
  // Selected item
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', document: '', address: '',
    city: '', state: '', zip_code: '', birth_date: '', status: 'active'
  })
  const [formErrors, setFormErrors] = useState({})

  const effectiveViewMode = viewMode === 'auto' ? (isMobile ? 'cards' : 'table') : viewMode

  // Queries
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: async (data) => {
      await logCreate('customer', data.id, data)
      await invalidateQueries(['customers'])
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
      showFeedback('success', 'Cliente excluído!')
      setIsDeleteModalOpen(false)
    },
    onError: async (error) => {
      showFeedback('error', error.message)
      await logError('customer', error, { action: 'delete' })
    }
  })

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  // Handlers
  const handlers = useCustomersHandlers({
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
  })

  const renderCustomerCard = (customer) => (
    <CustomerCard
      customer={customer}
      onEdit={handlers.handleOpenModal}
      onDelete={handlers.handleDeleteClick}
      onCommunicate={handlers.handleCommunicate}
      onSendCampaign={handlers.handleSendCampaign}
    />
  )

  React.useEffect(() => {
    logAction({ 
      action: 'VIEW', 
      entityType: 'customer', 
      details: { user_role: profile?.role } 
    })
  }, [])

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  if (customersError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
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
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {feedback.show && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback({ show: false })} 
          />
        )}

        <PageHeader
          title="Clientes"
          description={
            <>
              Gerencie seus clientes cadastrados ({customers.length})
              {isFetching && (
                <span className="ml-2 inline-flex items-center text-xs text-gray-400 dark:text-gray-500">
                  <RefreshCw size={12} className="animate-spin mr-1" />
                  Atualizando...
                </span>
              )}
            </>
          }
          icon={UsersIcon}
          actions={[
            {
              label: 'Novo Cliente',
              icon: UserPlus,
              onClick: () => handlers.handleOpenModal(),
              variant: 'primary',
              disabled: isMutating
            }
          ]}
          extraContent={<RFVLegend />}
        />

        <div className="mb-4 sm:mb-6">
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
            action={<Button onClick={() => handlers.handleOpenModal()} disabled={isMutating} size="sm">Cadastrar Cliente</Button>} 
          />
        ) : effectiveViewMode === 'cards' ? (
          <DataCards
            data={filteredCustomers}
            renderCard={renderCustomerCard}
            keyExtractor={(customer) => customer.id}
            columns={isMobile ? 1 : 2}
            gap={4}
            emptyMessage="Nenhum cliente encontrado"
          />
        ) : (
          <CustomerTable 
            customers={filteredCustomers} 
            onEdit={handlers.handleOpenModal} 
            onDelete={handlers.handleDeleteClick} 
            onCommunicate={handlers.handleCommunicate} 
            onSendCampaign={handlers.handleSendCampaign}
            onRefresh={refetchCustomers}
            loading={isLoading}
            enableExport={true}
            enableRefresh={true}
            enableSelection={true}
            showSummary={true}
          />
        )}

        <CustomersModalsContainer
          isModalOpen={isModalOpen}
          onCloseModal={handlers.handleCloseModal}
          selectedCustomer={selectedCustomer}
          formData={formData}
          formErrors={formErrors}
          setFormData={setFormData}
          onSubmit={handlers.handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          isDeleteModalOpen={isDeleteModalOpen}
          onCloseDeleteModal={handlers.handleCloseDeleteModal}
          onConfirmDelete={handlers.handleDelete}
          deletePending={deleteMutation.isPending}
          showBirthdayConfirmModal={showBirthdayConfirmModal}
          onCloseBirthdayModal={handlers.handleCloseBirthdayModal}
          onConfirmBirthday={handlers.handleSendBirthdayCampaign}
          campaignLoading={campaignLoading}
          showCampaignModal={showCampaignModal}
          onCloseCampaignModal={handlers.handleCloseCampaignModal}
          onSendCampaign={handlers.handleSendCustomCampaign}
        />
      </div>
    </div>
  )
}

export default Customers