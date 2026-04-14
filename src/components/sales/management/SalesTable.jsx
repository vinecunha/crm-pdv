import React from 'react'
import { User, Phone, Ticket, Banknote, CreditCard, QrCode, Ban } from '../../lib/icons'
import { useTableStrategy } from '../../hooks/useTableStrategy'
import Badge from '../Badge'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import { createAction } from '../../utils/actions'

const CheckCircleIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const ClockIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

const RefreshCwIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
)

const SalesTable = ({ sales, onViewDetails, onCancel, onPrint }) => {
  const TableComponent = useTableStrategy(sales, 100)

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: 'success', icon: CheckCircleIcon, text: 'Concluída' },
      cancelled: { variant: 'danger', icon: Ban, text: 'Cancelada' },
      pending: { variant: 'warning', icon: ClockIcon, text: 'Pendente' },
      refunded: { variant: 'info', icon: RefreshCwIcon, text: 'Reembolsada' }
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
    const icons = { cash: Banknote, credit_card: CreditCard, debit_card: CreditCard, pix: QrCode }
    const Icon = icons[method] || Banknote
    return <Icon size={16} />
  }

  const getPaymentMethodText = (method) => {
    const texts = { cash: 'Dinheiro', credit_card: 'Crédito', debit_card: 'Débito', pix: 'PIX' }
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
          <div className="text-sm font-medium text-gray-900">#{row.sale_number}</div>
          {row.coupon_code && (
            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
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
          <div className="text-sm text-gray-900">{formatDateTime(row.created_at)}</div>
          <div className="text-xs text-gray-500">por {row.created_by_email || 'Sistema'}</div>
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
          <User size={14} className="text-gray-400 flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-sm text-gray-900 truncate">{row.customer_name || 'Cliente não identificado'}</div>
            {row.customer_phone && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
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
          <div className="text-sm font-semibold text-gray-900">{formatCurrency(row.final_amount)}</div>
          {row.discount_amount > 0 && (
            <div className="text-xs text-green-600">Desc: {formatCurrency(row.discount_amount)}</div>
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
          <span className="text-sm text-gray-700">{getPaymentMethodText(row.payment_method)}</span>
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