import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Banknote, CreditCard, QrCode, DollarSign } from '@lib/icons' // ✅ Corrigido o import
import DataTable from '@components/ui/DataTable'
import { formatCurrency, formatNumber } from '@utils/formatters'

// Função para buscar os dados da API
const fetchPaymentMethods = async () => {
  const response = await fetch('/api/payment-methods/summary')
  if (!response.ok) throw new Error('Erro ao carregar formas de pagamento')
  return response.json()
}

const PaymentMethodsTable = ({ initialData, enabled = true }) => {
  const { 
    data, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['payment-methods-summary'],
    queryFn: fetchPaymentMethods,
    initialData,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  })

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
            <Icon size={18} className="text-gray-500 dark:text-gray-400" />
            <span className="text-gray-900 dark:text-white">{labels[row.payment_method] || row.payment_method}</span>
          </div>
        )
      }
    },
    {
      key: 'count',
      header: 'Qtd. Vendas',
      render: (row) => <div className="text-center font-medium text-gray-900 dark:text-white">{formatNumber(row.count)}</div>
    },
    {
      key: 'total',
      header: 'Valor Total',
      render: (row) => <div className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(row.total)}</div>
    }
  ]

  // Estados de loading e erro
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCard size={20} />
          Vendas por Meio de Pagamento
        </h2>
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CreditCard size={20} />
          Vendas por Meio de Pagamento
        </h2>
        <div className="text-center text-red-600 dark:text-red-400 py-8">
          <p>Erro ao carregar dados: {error.message}</p>
          <button 
            onClick={() => refetch()}
            className="mt-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!data?.length) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <CreditCard size={20} />
        Vendas por Meio de Pagamento
      </h2>
      <DataTable columns={columns} data={data} pagination={false} striped />
    </div>
  )
}

export default PaymentMethodsTable
