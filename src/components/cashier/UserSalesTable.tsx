import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { User, RefreshCw } from '@lib/icons'
import DataTable from '@components/ui/DataTable'
import { formatCurrency, formatNumber } from '@utils/formatters'

// Função para buscar os dados da API
const fetchUserSales = async (filters) => {
  const queryParams = new URLSearchParams(filters).toString()
  const url = `/api/user-sales/performance${queryParams ? `?${queryParams}` : ''}`
  
  const response = await fetch(url)
  if (!response.ok) throw new Error('Erro ao carregar desempenho dos operadores')
  return response.json()
}

const UserSalesTable = ({ 
  initialData, 
  enabled = true, 
  filters = {},
  showRefreshButton = true 
}) => {
  const { 
    data, 
    isLoading, 
    error,
    refetch,
    isFetching 
  } = useQuery({
    queryKey: ['user-sales-performance', filters],
    queryFn: () => fetchUserSales(filters),
    initialData,
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: 2
  })

  const columns = useMemo(() => [
    {
      key: 'user_name',
      header: 'Operador',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-400 dark:text-gray-500" />
          <span className="font-medium text-gray-900 dark:text-white">{row.user_name || 'Sistema'}</span>
        </div>
      )
    },
    {
      key: 'total_vendas',
      header: 'Vendas',
      sortable: true,
      render: (row) => <div className="text-center"><span className="font-semibold text-gray-900 dark:text-white">{formatNumber(row.total_vendas)}</span></div>
    },
    {
      key: 'total_valor',
      header: 'Valor Total',
      sortable: true,
      render: (row) => <div className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(row.total_valor)}</div>
    },
    {
      key: 'total_descontos',
      header: 'Descontos',
      sortable: true,
      render: (row) => <div className="text-orange-600 dark:text-orange-400">{formatCurrency(row.total_descontos)}</div>
    },
    {
      key: 'media_ticket',
      header: 'Ticket Médio',
      sortable: true,
      render: (row) => <div className="text-gray-900 dark:text-white">{formatCurrency(row.media_ticket)}</div>
    }
  ], [])

  // Estados de loading e erro
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={20} />
            Desempenho por Operador
          </h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={20} />
            Desempenho por Operador
          </h2>
        </div>
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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <User size={20} />
          Desempenho por Operador
        </h2>
        {showRefreshButton && (
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Atualizar dados"
          >
            <RefreshCw size={18} className={isFetching ? 'animate-spin' : ''} />
          </button>
        )}
      </div>
      <DataTable columns={columns} data={data} pagination={false} striped />
    </div>
  )
}

export default UserSalesTable
