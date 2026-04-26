import React from 'react'
import ConfirmModal from '@components/ui/ConfirmModal'

const CustomerDeleteModal = ({ 
  isOpen, 
  onClose, 
  customer, 
  onConfirm, 
  isSubmitting 
}) => {
  if (!customer) return null

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={isSubmitting}
      title="Excluir Cliente"
      message={
        <div>
          <p className="text-gray-700 dark:text-gray-200">
            Tem certeza que deseja excluir o cliente <strong className="dark:text-white">{customer.name}</strong>?
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Esta ação não poderá ser desfeita.
          </p>
        </div>
      }
      confirmText="Excluir"
      variant="danger"
    />
  )
}

export default CustomerDeleteModal