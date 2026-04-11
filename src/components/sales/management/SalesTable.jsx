import React from 'react'
import { Eye, Ban, Printer, User, Phone, Ticket, Banknote, CreditCard, QrCode } from 'lucide-react'
import DataTable from '../../ui/DataTable'
import { formatCurrency, formatDateTime } from '../../../utils/formatters'

const SalesTable = ({ sales, onViewDetails, onCancel, onPrint }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'green', icon: CheckCircle, text: 'Concluída' },
      cancelled: { color: 'red', icon: Ban, text: 'Cancelada' },
      pending: { color: 'yellow', icon: Clock, text: 'Pendente' },
      refunded: { color: 'orange', icon: RefreshCw, text: 'Reembolsada' }
    }
    const config = statusConfig[status] || statusConfig.completed
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
        <Icon size={12} />
        {config.text}
      </span>
    )
  }

  const getPaymentMethodIcon = (method) => {
    const icons = { cash: Banknote, credit_card: CreditCard, debit_card: CreditCard, pix: QrCode }
    const Icon = icons[method] || Banknote
    return <Icon size={16} />
  }

  const getPaymentMethodText = (method) => {
    const texts = { cash: 'Dinheiro', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', pix: 'PIX' }
    return texts[method] || method
  }

  const columns = [
    {
      key: 'sale_number',
      header: 'Nº Venda',
      sortable: true,
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
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={14} className="text-gray-400" />
          <div>
            <div className="text-sm text-gray-900">{row.customer_name || 'Cliente não identificado'}</div>
            {row.customer_phone && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Phone size={10} />
                {row.customer_phone}
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
      render: (row) => getStatusBadge(row.status)
    }
  ]

  const actions = [
    {
      label: 'Ver detalhes',
      icon: <Eye size={18} />,
      className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
      onClick: onViewDetails
    },
    {
      label: 'Cancelar venda',
      icon: <Ban size={18} />,
      className: 'text-red-600 hover:text-red-800 hover:bg-red-50',
      onClick: onCancel,
      disabled: (row) => row.status !== 'completed'
    },
    {
      label: 'Imprimir',
      icon: <Printer size={18} />,
      className: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
      onClick: onPrint
    }
  ]

  return (
    <DataTable
      columns={columns}
      data={sales}
      actions={actions}
      onRowClick={onViewDetails}
      emptyMessage="Nenhuma venda encontrada"
      striped
      hover
      pagination
      itemsPerPageOptions={[20, 50, 100]}
      defaultItemsPerPage={20}
      showTotalItems
    />
  )
}

// Componentes auxiliares
const CheckCircle = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const Clock = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
)

const RefreshCw = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
)

export default SalesTable