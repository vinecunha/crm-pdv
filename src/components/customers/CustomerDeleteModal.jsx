import React from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

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
        <p className="text-gray-700">
          Tem certeza que deseja excluir o cliente <strong>{customer.name}</strong>?
        </p>
        <p className="text-sm text-red-600">
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