// src/components/commissions/CommissionDetailsModal.jsx
import React from 'react'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import { formatCurrency } from '@utils/formatters'
import { CheckCircle, DollarSign, Calendar, Hash } from '@lib/icons'

const CommissionDetailsModal = ({ 
  isOpen, 
  onClose, 
  group, 
  onPaySingle,
  onPayAll,
  canMarkAsPaid 
}) => {
  if (!group) return null
  
  const { user, commissions, totalAmount, count } = group
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Comissões de ${user?.full_name || 'Vendedor'}`}
      size="lg"
    >
      {/* Resumo */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total de Vendas</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{count}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total a Pagar</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Média por Venda</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalAmount / count)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Lista de Comissões */}
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-2">
          {commissions.map((commission, index) => (
            <div 
              key={commission.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                  #{index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Hash size={12} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Venda #{commission.sale_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <DollarSign size={10} />
                      {commission.percentage}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(commission.amount)}
                </span>
                {canMarkAsPaid && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={CheckCircle}
                    onClick={() => onPaySingle(commission)}
                  >
                    Pagar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Ações */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {user?.email}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {canMarkAsPaid && (
            <Button 
              variant="success" 
              icon={CheckCircle}
              onClick={() => {
                onPayAll()
                onClose()
              }}
            >
              Pagar Todas ({count})
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default CommissionDetailsModal
