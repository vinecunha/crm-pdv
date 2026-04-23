import React from 'react'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'

const CustomerDeleteModal = ({ 
  isOpen, 
  onClose, 
  customer, 
  onConfirm, 
  isSubmitting 
}) => {
  if (!customer) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Excluir Cliente"
      size="sm"
      isLoading={isSubmitting}
    >
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-200">
          Tem certeza que deseja excluir o cliente <strong className="dark:text-white">{customer.name}</strong>?
        </p>
        <p className="text-sm text-red-600 dark:text-red-400">
          Esta ação não poderá ser desfeita.
        </p>
        
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} loading={isSubmitting}>
            Excluir
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CustomerDeleteModal
