// src/pages/Coupons.jsx
import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Ticket } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import { useReactQuery } from '@hooks/useReactQuery'
import { useSystemLogs } from '@hooks/useSystemLogs'
import useLogger from '@hooks/useLogger'
import useMediaQuery from '@hooks/useMediaQuery'
import logger from '@utils/logger'

import * as couponService from '@services/couponService'

import Button from '@components/ui/Button'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import PageHeader from '@components/ui/PageHeader'
import DataCards from '@components/ui/DataCards'
import CouponCard from '@components/coupons/CouponCard'

import CouponStats from '@components/coupons/CouponStats'
import CouponTable from '@components/coupons/CouponTable'
import CouponFilters from '@components/coupons/CouponFilters'
import CouponsModalsContainer from '@components/coupons/CouponsModalsContainer'

import { useCouponsHandlers } from '@/hooks/handlers'

const Coupons = () => {
  const { profile, user } = useAuth()
  const { logError } = useSystemLogs()
  const { logComponentAction, logCreate, logUpdate, logDelete } = useLogger('Coupons')
  const { invalidateQueries } = useReactQuery()
  const queryClient = useQueryClient()
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  const [viewMode] = useState('auto')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  
  // Selected items
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [selectedCouponForCampaign, setSelectedCouponForCampaign] = useState(null)
  const [couponToDelete, setCouponToDelete] = useState(null)
  const [selectedCustomers, setSelectedCustomers] = useState([])
  
  // Form data
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', discount_type: 'percent',
    discount_value: '', max_discount: '', min_purchase: '0',
    is_global: true, is_active: true, valid_from: '', valid_to: '', usage_limit: ''
  })

  const effectiveViewMode = viewMode === 'auto' ? (isMobile ? 'cards' : 'table') : viewMode

  // Queries
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
    refetchOnMount: true,
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

  // Mutations
  const createMutation = useMutation({
    mutationFn: ({ couponData, allowedCustomers }) => 
      couponService.createCoupon(couponData, allowedCustomers, profile),
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
    mutationFn: ({ id, couponData, allowedCustomers }) => 
      couponService.updateCoupon(id, couponData, allowedCustomers, profile),
    onSuccess: async (coupon) => {
      await logUpdate('coupon', coupon.id, editingCoupon, coupon)
      await invalidateQueries(['coupons'])
      showFeedback('success', `Cupom ${coupon.code} atualizado!`)
      setShowModal(false)
    },
    onError: async (error) => {
      showFeedback('error', `Erro ao atualizar: ${error.message}`)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => couponService.deleteCoupon(id),
    onSuccess: async (_, id) => {
      await logDelete('coupon', id, couponToDelete)
      await invalidateQueries(['coupons'])
      showFeedback('success', `Cupom excluído!`)
      setShowDeleteConfirmModal(false)
      setCouponToDelete(null)
    },
    onError: (error) => {
      showFeedback('error', `Erro ao excluir: ${error.message}`)
      setShowDeleteConfirmModal(false)
    }
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, currentStatus }) => 
      couponService.toggleCouponStatus(id, currentStatus, profile),
    onSuccess: async (coupon) => {
      await invalidateQueries(['coupons'])
      showFeedback('success', `Cupom ${coupon.is_active ? 'ativado' : 'desativado'}!`)
    }
  })

  const addCustomerMutation = useMutation({
    mutationFn: ({ couponId, customer }) => 
      couponService.addAllowedCustomer(couponId, customer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers', selectedCoupon?.id] })
      showFeedback('success', 'Cliente adicionado!')
    }
  })

  const removeCustomerMutation = useMutation({
    mutationFn: ({ couponId, customerId }) => 
      couponService.removeAllowedCustomer(couponId, customerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allowed-customers', selectedCoupon?.id] })
      showFeedback('success', 'Cliente removido!')
    }
  })

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  // Handlers
  const handlers = useCouponsHandlers({
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
  })

  const renderCouponCard = (coupon) => (
    <CouponCard
      coupon={coupon}
      onEdit={handlers.handleOpenModal}
      onManageCustomers={handlers.handleOpenCustomersModal}
      onToggleStatus={handlers.handleToggleStatus}
      onDelete={handlers.handleDeleteCoupon}
      onCopyCode={handlers.handleCopyCode}
      onSendCampaign={handlers.handleOpenCampaignModal}
    />
  )

  React.useEffect(() => {
    logComponentAction('ACCESS_PAGE', null, { page: 'coupons' })
  }, [])

  const isMutating = createMutation.isPending || updateMutation.isPending || 
                     deleteMutation.isPending || toggleStatusMutation.isPending

  if (couponsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
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
          title="Cupons de Desconto"
          description={
            <>
              Gerencie cupons globais e restritos para seus clientes
              {isFetchingCoupons && (
                <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">atualizando...</span>
              )}
            </>
          }
          icon={Ticket}
          actions={[
            {
              label: 'Novo Cupom',
              icon: Plus,
              onClick: () => handlers.handleOpenModal(),
              variant: 'primary',
              disabled: isMutating
            }
          ]}
        />

        <div className="mb-4 sm:mb-6">
          <CouponStats coupons={coupons} />
        </div>
        
        <CouponFilters 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          filters={filters} 
          setFilters={setFilters} 
        />
        
        {effectiveViewMode === 'cards' ? (
          <DataCards
            data={coupons}
            renderCard={renderCouponCard}
            keyExtractor={(coupon) => coupon.id}
            columns={isMobile ? 1 : 2}
            gap={4}
            emptyMessage="Nenhum cupom encontrado"
          />
        ) : (
          <CouponTable 
            coupons={coupons} 
            onEdit={handlers.handleOpenModal} 
            onManageCustomers={handlers.handleOpenCustomersModal} 
            onToggleStatus={handlers.handleToggleStatus} 
            onDelete={handlers.handleDeleteCoupon} 
            onCopyCode={handlers.handleCopyCode}
            onSendCampaign={handlers.handleOpenCampaignModal}
          />
        )}

        <CouponsModalsContainer
          showModal={showModal}
          closeModal={handlers.closeModal}
          editingCoupon={editingCoupon}
          formData={formData}
          setFormData={setFormData}
          customers={customers}
          selectedCustomers={selectedCustomers}
          setSelectedCustomers={setSelectedCustomers}
          isMutating={isMutating}
          onSave={handlers.handleSaveCoupon}
          createPending={createMutation.isPending}
          updatePending={updateMutation.isPending}
          showCustomersModal={showCustomersModal}
          closeCustomersModal={handlers.closeCustomersModal}
          selectedCoupon={selectedCoupon}
          allowedCustomers={allowedCustomers}
          onAddCustomer={handlers.handleAddCustomer}
          onRemoveCustomer={handlers.handleRemoveCustomer}
          addPending={addCustomerMutation.isPending}
          removePending={removeCustomerMutation.isPending}
          showCampaignModal={showCampaignModal}
          closeCampaignModal={handlers.closeCampaignModal}
          selectedCouponForCampaign={selectedCouponForCampaign}
          onSendCampaign={handlers.handleSendCampaign}
          showDeleteConfirmModal={showDeleteConfirmModal}
          onCancelDelete={handlers.handleCancelDelete}
          onConfirmDelete={handlers.handleConfirmDelete}
          couponToDelete={couponToDelete}
          deletePending={deleteMutation.isPending}
        />
      </div>
    </div>
  )
}

export default Coupons