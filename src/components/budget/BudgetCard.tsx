// components/budget/BudgetCard.jsx
import React from 'react'
import { 
  Phone, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Check,
  ChevronRight
} from '@lib/icons'
import Badge from '@components/ui/Badge'
import { formatCurrency, formatDate } from '@utils/formatters'

const BudgetCard = ({ budget, onClick, onApprove, onReject }) => {
  const getStatusBadge = (status) => {
    const configs = { 
      pending: { label: 'Pendente', variant: 'warning', icon: Clock }, 
      approved: { label: 'Aprovado', variant: 'success', icon: CheckCircle }, 
      rejected: { label: 'Rejeitado', variant: 'danger', icon: XCircle }, 
      expired: { label: 'Expirado', variant: 'secondary', icon: AlertTriangle }, 
      converted: { label: 'Convertido', variant: 'info', icon: Check } 
    }
    const config = configs[status] || configs.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon size={10} className="mr-1" />
        {config.label}
      </Badge>
    )
  }

  const isExpired = new Date(budget.valid_until) < new Date() && budget.status === 'pending'
  const canApprove = budget.status === 'pending'
  const canReject = budget.status === 'pending'

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
    >
      {/* Cabeçalho do Card */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => onClick?.(budget)}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                #{budget.budget_number}
              </span>
              {getStatusBadge(budget.status)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(budget.created_at)}
            </p>
          </div>
          <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
        </div>

        {/* Informações do Cliente */}
        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
            {budget.customer_name?.charAt(0) || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {budget.customer_name || 'Cliente não identificado'}
            </p>
            {budget.customer_phone && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Phone size={10} />
                <span className="truncate">{budget.customer_phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Valores e Validade */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {formatCurrency(budget.final_amount)}
            </span>
          </div>
          
          {budget.discount_amount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">Desconto:</span>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">
                -{formatCurrency(budget.discount_amount)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">Válido até:</span>
            <span className={`text-xs font-medium ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {formatDate(budget.valid_until)}
            </span>
          </div>
        </div>
      </div>

      {/* Ações do Card */}
      {canApprove && (
        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onApprove?.(budget)
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
          >
            <CheckCircle size={14} />
            Aprovar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onReject?.(budget)
            }}
            className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <XCircle size={14} />
            Rejeitar
          </button>
        </div>
      )}
    </div>
  )
}

export default BudgetCard

