// src/components/customers/CustomersModalsContainer.jsx
import React from 'react'
import Modal from '@components/ui/Modal'
import ConfirmModal from '@components/ui/ConfirmModal'
import CampaignModal from '@components/customers/CampaignModal'
import CustomerForm from '@components/customers/CustomerForm'
import CustomerDeleteModal from '@components/customers/CustomerDeleteModal'

const CustomersModalsContainer = ({
  // Form Modal
  isModalOpen,
  onCloseModal,
  selectedCustomer,
  formData,
  formErrors,
  setFormData,
  onSubmit,
  isSubmitting,
  
  // Delete Modal
  isDeleteModalOpen,
  onCloseDeleteModal,
  onConfirmDelete,
  deletePending,
  
  // Birthday Modal
  showBirthdayConfirmModal,
  onCloseBirthdayModal,
  onConfirmBirthday,
  campaignLoading,
  
  // Campaign Modal
  showCampaignModal,
  onCloseCampaignModal,
  onSendCampaign
}) => {
  return (
    <>
      {/* Modal de Formulário */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={!isSubmitting ? onCloseModal : undefined} 
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
          onSubmit={onSubmit} 
          onCancel={onCloseModal} 
          isSubmitting={isSubmitting} 
          isEditing={!!selectedCustomer} 
        />
      </Modal>

      {/* Modal de Exclusão */}
      <CustomerDeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={onCloseDeleteModal} 
        customer={selectedCustomer} 
        onConfirm={onConfirmDelete} 
        isSubmitting={deletePending} 
      />

      {/* Modal de Confirmação de Aniversário */}
      <ConfirmModal
        isOpen={showBirthdayConfirmModal}
        onClose={onCloseBirthdayModal}
        onConfirm={onConfirmBirthday}
        title="🎂 Campanha de Aniversário"
        message={
          <div className="space-y-2">
            <p className="dark:text-gray-300 text-sm">
              Deseja enviar um cupom de <strong>10% OFF</strong> para <strong>{selectedCustomer?.name}</strong>?
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              O cliente receberá o cupom <strong>ANIVERSARIO</strong> válido por 30 dias.
            </p>
          </div>
        }
        confirmText="Enviar Cupom"
        cancelText="Cancelar"
        variant="success"
        loading={campaignLoading}
      />

      {/* Modal de Campanha */}
      <CampaignModal
        isOpen={showCampaignModal}
        onClose={onCloseCampaignModal}
        onSend={onSendCampaign}
        customer={selectedCustomer}
        loading={campaignLoading}
      />
    </>
  )
}

export default CustomersModalsContainer
