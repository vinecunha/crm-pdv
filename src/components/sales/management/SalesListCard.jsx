import React from 'react'
import { 
  Eye, 
  Ban, 
  Printer, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  CreditCard,
  ChevronRight,
  User
} from '@lib/icons'
import Badge from '../../Badge'
import { formatCurrency, formatDateTime } from '@utils/formatters'

const SalesListCard = ({ sale, onViewDetails, onCancel, onPrint, canCancel, canRequestCancellation }) => {
  const paymentIcons = { 
    cash: '💵', 
    credit_card: '💳', 
    debit_card: '🏧', 
    pix: '📱' 
  }
  
  const paymentLabels = { 
    cash: 'Dinheiro', 
    credit_card: 'Crédito', 
    debit_card: 'Débito', 
    pix: 'PIX' 
  }

  const getStatusBadge = (status) => {
    const configs = {
      completed: { label: 'Concluída', variant: 'success', icon: CheckCircle },
      cancelled: { label: 'Cancelada', variant: 'danger', icon: XCircle },
      pending: { label: 'Pendente', variant: 'warning', icon: Clock }
    }
    const config = configs[status] || configs.completed
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="text-xs">
        <Icon size={10} className="mr-1" />
        {config.label}
      </Badge>
    )
  }

  const canShowCancel = canCancel || canRequestCancellation
  const isCancellable = sale.status === 'completed'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Cabeçalho do Card */}
      <div 
        className="p-4 cursor-pointer"
        onClick={() => onViewDetails?.(sale)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                #{sale.sale_number}
              </span>
              {getStatusBadge(sale.status)}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar size={12} />
              {formatDateTime(sale.created_at)}
            </p>
          </div>
          <ChevronRight size={20} className="text-gray-400 dark:text-gray-500" />
        </div>

        {/* Informações do Cliente */}
        <div className="flex items-center gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
            {sale.customer_name?.charAt(0) || 'C'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {sale.customer_name || 'Cliente não identificado'}
            </p>
            {sale.customer_phone && (
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <User size={10} />
                <span className="truncate">{sale.customer_phone}</span>
              </p>
            )}
          </div>
        </div>

        {/* Informações de Pagamento e Valores */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
              <CreditCard size={14} />
              Pagamento:
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1">
              <span>{paymentIcons[sale.payment_method] || '💰'}</span>
              <span>{paymentLabels[sale.payment_method] || sale.payment_method}</span>
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total:</span>
            <div className="text-right">
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(sale.final_amount)}
              </span>
              {sale.discount_amount > 0 && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  -{formatCurrency(sale.discount_amount)} desc.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Ações do Card */}
      <div className="grid grid-cols-3 gap-1 p-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onViewDetails?.(sale)
          }}
          className="flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Eye size={14} />
          Ver
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation()
            onPrint?.(sale)
          }}
          className="flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Printer size={14} />
          Imprimir
        </button>

        {canShowCancel && isCancellable && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCancel?.(sale)
            }}
            className={`flex items-center justify-center gap-1 px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
              canCancel 
                ? 'text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                : 'text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30'
            }`}
          >
            <Ban size={14} />
            {canCancel ? 'Cancelar' : 'Solicitar'}
          </button>
        )}
      </div>
    </div>
  )
}

export default SalesListCard