// src/pages/Coupons.jsx
import React, { useState } from 'react'
import { Plus, RefreshCw, Ticket } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import useLogger from '@hooks/system/useLogger'
import useMediaQuery from '@/hooks/utils/useMediaQuery'

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

// ✅ Hooks centralizados
import { useCouponsHandlers } from '@hooks/handlers'
import { useCouponMutations } from '@hooks/mutations'
import { useCouponsQueries } from '@hooks/queries/useCouponsQueries'
import { useCouponForm } from '@hooks/forms/useCouponForm'

const Coupons = () => {
  const { profile, user } = useAuth()
  const { logComponentAction } = useLogger('Coupons')
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  // Estados de UI
  const [viewMode] = useState('auto')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  // Estados de modais
  const [showModal, setShowModal] = useState(false)
  const [showCustomersModal, setShowCustomersModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
  
  // Estados de seleção
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [selectedCoupon, setSelectedCoupon] = useState(null)
  const [selectedCouponForCampaign, setSelectedCouponForCampaign] = useState(null)
  const [couponToDelete, setCouponToDelete] = useState(null)
  const [selectedCustomers, setSelectedCustomers] = useState([])

  const effectiveViewMode = viewMode === 'auto' ? (isMobile ? 'cards' : 'table') : viewMode

  // ✅ Queries centralizadas
  const {
    coupons,
    isLoadingCoupons,
    couponsError,
    refetchCoupons,
    isFetchingCoupons,
    customers,
    allowedCustomers
  } = useCouponsQueries({ searchTerm, filters, editingCoupon })

  // ✅ Form centralizado
  const {
    formData,
    setFormData,
    resetForm,
    setFormForEditing,
    getCouponPayload,
    validate
  } = useCouponForm()

  // Feedback
  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  // ✅ Mutations com callbacks
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    toggleStatusMutation,
    addCustomerMutation,
    removeCustomerMutation,
    isMutating
  } = useCouponMutations(profile, {
    onCouponCreated: (coupon) => {
      showFeedback('success', `Cupom ${coupon.code} criado!`)
      setShowModal(false)
      resetForm()
    },
    onCouponUpdated: (coupon) => {
      showFeedback('success', `Cupom ${coupon.code} atualizado!`)
      setShowModal(false)
      resetForm()
    },
    onCouponDeleted: () => {
      showFeedback('success', 'Cupom excluído!')
      setShowDeleteConfirmModal(false)
      setCouponToDelete(null)
    },
    onStatusToggled: (coupon) => {
      showFeedback('success', `Cupom ${coupon.is_active ? 'ativado' : 'desativado'}!`)
    },
    onCustomerAdded: () => {
      showFeedback('success', 'Cliente adicionado!')
    },
    onCustomerRemoved: () => {
      showFeedback('success', 'Cliente removido!')
    },
    onError: (error) => {
      showFeedback('error', error.message)
    }
  })

  // ✅ Handlers
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
    showFeedback,
    setFormForEditing,
    resetForm,
    getCouponPayload,
    validate
  })

  // Renderização de cards
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

  // Log de acesso
  React.useEffect(() => {
    logComponentAction('ACCESS_PAGE', null, { page: 'coupons' })
  }, [])

  // Estados de erro/carregamento
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

  // Render principal
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
