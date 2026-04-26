import React from 'react'
import ConfirmModal from '@components/ui/ConfirmModal'

const ProductDeleteModal = ({ 
  isOpen, 
  onClose, 
  product, 
  onConfirm, 
  isSubmitting 
}) => {
  if (!product) return null

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      loading={isSubmitting}
      title="Excluir Produto"
      message={
        <div>
          <p className="mb-2">Você está prestes a excluir o produto:</p>
          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
          {product.stock_quantity > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              ⚠️ Este produto possui {product.stock_quantity} unidades em estoque!
            </p>
          )}
        </div>
      }
      confirmText="Excluir"
      variant="danger"
    />
  )
}

export default ProductDeleteModal