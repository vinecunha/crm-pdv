// src/components/coupons/CouponsModalsContainer.jsx
import React from 'react'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import ConfirmModal from '@components/ui/ConfirmModal'
import CouponForm from './CouponForm'
import CouponCustomersModal from './CouponCustomersModal'
import CouponCampaignModal from './CouponCampaignModal'

const CouponsModalsContainer = ({
  // Form Modal
  showModal,
  closeModal,
  editingCoupon,
  formData,
  setFormData,
  customers,
  selectedCustomers,
  setSelectedCustomers,
  isMutating,
  onSave,
  createPending,
  updatePending,
  
  // Customers Modal
  showCustomersModal,
  closeCustomersModal,
  selectedCoupon,
  allowedCustomers,
  onAddCustomer,
  onRemoveCustomer,
  addPending,
  removePending,
  
  // Campaign Modal
  showCampaignModal,
  closeCampaignModal,
  selectedCouponForCampaign,
  onSendCampaign,
  
  // Delete Confirm
  showDeleteConfirmModal,
  onCancelDelete,
  onConfirmDelete,
  couponToDelete,
  deletePending
}) => {
  return (
    <>
      {/* Modal de Formulário */}
      <Modal 
        isOpen={showModal} 
        onClose={!isMutating ? closeModal : undefined} 
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
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 mt-4 border-t dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={closeModal} 
            className="flex-1 order-2 sm:order-1" 
            disabled={isMutating}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onSave} 
            loading={createPending || updatePending} 
            className="flex-1 order-1 sm:order-2"
          >
            {editingCoupon ? 'Atualizar' : 'Criar'} Cupom
          </Button>
        </div>
      </Modal>

      {/* Modal de Clientes Permitidos */}
      <CouponCustomersModal 
        isOpen={showCustomersModal} 
        onClose={closeCustomersModal} 
        coupon={selectedCoupon} 
        allowedCustomers={allowedCustomers} 
        customers={customers} 
        onAddCustomer={onAddCustomer} 
        onRemoveCustomer={onRemoveCustomer} 
        loading={addPending || removePending} 
      />

      {/* Modal de Campanha */}
      <CouponCampaignModal
        isOpen={showCampaignModal}
        onClose={closeCampaignModal}
        coupon={selectedCouponForCampaign}
        onSend={onSendCampaign}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmModal
        isOpen={showDeleteConfirmModal}
        onClose={onCancelDelete}
        onConfirm={onConfirmDelete}
        title="Confirmar Exclusão"
        message={
          <div className="space-y-2">
            <p className="dark:text-gray-300">
              Tem certeza que deseja excluir o cupom <strong>{couponToDelete?.code}</strong>?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta ação não pode ser desfeita.
            </p>
          </div>
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
        loading={deletePending}
      />
    </>
  )
}

export default CouponsModalsContainer