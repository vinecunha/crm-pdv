import React from 'react'
import { 
  User, 
  Phone, 
  Ticket, 
  Banknote, 
  CreditCard, 
  QrCode, 
  Ban,
  CheckCircle,
  Clock,
  RefreshCw
} from '../../lib/icons'
import { useTableStrategy } from '../../hooks/useTableStrategy'
import Badge from '../Badge'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { createAction } from '../../utils/actions'

const SalesTable = ({ sales, onViewDetails, onCancel, onPrint }) => {
  const TableComponent = useTableStrategy(sales, 100)

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: 'success', icon: CheckCircle, text: 'Concluída' },
      cancelled: { variant: 'danger', icon: Ban, text: 'Cancelada' },
      pending: { variant: 'warning', icon: Clock, text: 'Pendente' },
      refunded: { variant: 'info', icon: RefreshCw, text: 'Reembolsada' }
    }
    const config = statusConfig[status] || statusConfig.completed
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon size={12} />
        <span className="ml-1">{config.text}</span>
      </Badge>
    )
  }

  const getPaymentMethodIcon = (method) => {
    const icons = { 
      cash: Banknote, 
      credit_card: CreditCard, 
      debit_card: CreditCard, 
      pix: QrCode 
    }
    const Icon = icons[method] || Banknote
    return <Icon size={16} />
  }

  const getPaymentMethodText = (method) => {
    const texts = { 
      cash: 'Dinheiro', 
      credit_card: 'Crédito', 
      debit_card: 'Débito', 
      pix: 'PIX' 
    }
    return texts[method] || method
  }

  const columns = [
    {
      key: 'sale_number',
      header: 'Nº Venda',
      sortable: true,
      width: '130px',
      render: (row) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            #{row.sale_number}
          </div>
          {row.coupon_code && (
            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
              <Ticket size={12} />
              {row.coupon_code}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      header: 'Data/Hora',
      sortable: true,
      width: '160px',
      render: (row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-white">
            {formatDateTime(row.created_at)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            por {row.created_by_email || 'Sistema'}
          </div>
        </div>
      )
    },
    {
      key: 'customer_name',
      header: 'Cliente',
      sortable: true,
      width: '20%',
      minWidth: '180px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm text-gray-900 dark:text-white truncate">
              {row.customer_name || 'Cliente não identificado'}
            </div>
            {row.customer_phone && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Phone size={10} />
                <span className="truncate">{row.customer_phone}</span>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'final_amount',
      header: 'Total',
      sortable: true,
      width: '130px',
      render: (row) => (
        <div>
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(row.final_amount)}
          </div>
          {row.discount_amount > 0 && (
            <div className="text-xs text-green-600 dark:text-green-400">
              Desc: {formatCurrency(row.discount_amount)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'payment_method',
      header: 'Pagamento',
      sortable: true,
      width: '130px',
      render: (row) => (
        <div className="flex items-center gap-1">
          {getPaymentMethodIcon(row.payment_method)}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {getPaymentMethodText(row.payment_method)}
          </span>
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '130px',
      render: (row) => getStatusBadge(row.status)
    }
  ]

  const actions = [
    createAction('view', onViewDetails),
    createAction('cancel', onCancel, {
      disabled: (row) => row.status !== 'completed'
    }),
    createAction('print', onPrint)
  ]

  return (
    <TableComponent
      columns={columns}
      data={sales}
      actions={actions}
      onRowClick={onViewDetails}
      emptyMessage="Nenhuma venda encontrada"
      striped
      hover
      showTotalItems
    />
  )
}

export default SalesTable