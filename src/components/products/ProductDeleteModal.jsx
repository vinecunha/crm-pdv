import React from 'react'
import { AlertTriangle } from '../../lib/icons'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatNumber } from '../../utils/formatters'

const ProductDeleteModal = ({ 
  isOpen, 
  onClose, 
  product, 
  onConfirm, 
  isSubmitting 
}) => {
  if (!product) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title="Excluir Produto"
      size="sm"
    >
      <div className="space-y-4 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Tem certeza?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Você está prestes a excluir o produto:
          </p>
          <p className="font-medium text-gray-900 dark:text-white mt-2">
            {product.name}
          </p>
          {product.stock_quantity > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              ⚠️ Este produto possui {formatNumber(product.stock_quantity)} unidades em estoque!
            </p>
          )}
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            loading={isSubmitting}
            className="flex-1"
          >
            Excluir
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ProductDeleteModal