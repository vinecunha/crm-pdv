import React from 'react'
import { Banknote, CreditCard, QrCode, DollarSign } from 'lucide-react'
import DataTable from '../ui/DataTable'
import { formatCurrency, formatNumber } from '../../utils/formatters'

const PaymentMethodsTable = ({ data }) => {
  if (!data?.length) return null

  const columns = [
    {
      key: 'payment_method',
      header: 'Forma de Pagamento',
      render: (row) => {
        const icons = { cash: Banknote, credit_card: CreditCard, debit_card: CreditCard, pix: QrCode }
        const labels = { cash: 'Dinheiro', credit_card: 'Cartão Crédito', debit_card: 'Cartão Débito', pix: 'PIX' }
        const Icon = icons[row.payment_method] || DollarSign
        return (
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-gray-500" />
            <span>{labels[row.payment_method] || row.payment_method}</span>
          </div>
        )
      }
    },
    {
      key: 'count',
      header: 'Qtd. Vendas',
      render: (row) => <div className="text-center font-medium">{formatNumber(row.count)}</div>
    },
    {
      key: 'total',
      header: 'Valor Total',
      render: (row) => <div className="font-semibold text-green-600">{formatCurrency(row.total)}</div>
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <CreditCard size={20} />
        Vendas por Meio de Pagamento
      </h2>
      <DataTable columns={columns} data={data} pagination={false} striped />
    </div>
  )
}

export default PaymentMethodsTable