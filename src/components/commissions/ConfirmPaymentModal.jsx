// src/components/commissions/ConfirmPaymentModal.jsx
import React from 'react'
import ConfirmModal from '../ui/ConfirmModal'
import { formatCurrency } from '@utils/formatters'

const ConfirmPaymentModal = ({ isOpen, onClose, commission, onConfirm, isSubmitting }) => {
  if (!commission) return null
  
  const isBatch = commission.isBatch
  const amount = isBatch ? commission.totalAmount : commission.amount
  const count = isBatch ? commission.commissions?.length : 1
  
  const message = (
    <div className="space-y-3">
      <p className="text-gray-700 dark:text-gray-300">
        {isBatch 
          ? `Confirmar pagamento de ${count} comissões para:`
          : 'Confirmar pagamento da comissão para:'
        }
      </p>
      
      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {isBatch ? commission.user?.full_name : commission.user?.full_name}
        </p>
        {!isBatch && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {commission.user?.email}
          </p>
        )}
      </div>
      
      <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          {isBatch ? 'Total a Pagar' : 'Valor da Comissão'}
        </p>
        <p className="text-xl font-bold text-green-600 dark:text-green-400">
          {formatCurrency(amount)}
        </p>
        {isBatch && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {count} {count === 1 ? 'comissão' : 'comissões'}
          </p>
        )}
      </div>
    </div>
  )
  
  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={isBatch ? "Confirmar Pagamento em Lote" : "Confirmar Pagamento"}
      message={message}
      confirmText={isBatch ? "Pagar Todas" : "Confirmar Pagamento"}
      cancelText="Cancelar"
      variant="success"
      loading={isSubmitting}
      size="md"
    />
  )
}

export default ConfirmPaymentModal