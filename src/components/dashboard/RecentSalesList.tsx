import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, ChevronRight } from '@lib/icons'
import Badge from '@components/ui/Badge'
import { formatCurrency, formatDate } from '@utils/formatters'

const getStatusBadge = (status) => {
  const config = {
    completed: { label: 'Concluída', variant: 'success' },
    pending: { label: 'Pendente', variant: 'warning' },
    cancelled: { label: 'Cancelada', variant: 'danger' }
  }
  const { label, variant } = config[status] || config.pending
  return <Badge variant={variant} size="sm">{label}</Badge>
}

const getPaymentMethodLabel = (method) => {
  const methods = { 
    cash: 'Dinheiro', 
    credit: 'Crédito', 
    debit: 'Débito', 
    pix: 'PIX' 
  }
  return methods[method] || method
}

const RecentSalesList = ({ sales }) => {
  if (sales.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
        <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm">Nenhuma venda registrada ainda</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {sales.map((sale) => (
        <div 
          key={sale.id} 
          className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-2"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900 dark:text-white text-sm">
                #{sale.sale_number}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">
                {sale.customer}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(sale.date)} • {getPaymentMethodLabel(sale.payment_method)}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end sm:text-right gap-2">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {formatCurrency(sale.amount)}
            </p>
            {getStatusBadge(sale.status)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default RecentSalesList

