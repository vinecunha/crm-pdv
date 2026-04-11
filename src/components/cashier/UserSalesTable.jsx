import React from 'react'
import { User } from 'lucide-react'
import DataTable from '../ui/DataTable'
import { formatCurrency, formatNumber } from '../../utils/formatters'

const UserSalesTable = ({ data }) => {
  if (!data?.length) return null

  const columns = [
    {
      key: 'user_name',
      header: 'Operador',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-gray-400" />
          <span className="font-medium">{row.user_name || 'Sistema'}</span>
        </div>
      )
    },
    {
      key: 'total_vendas',
      header: 'Vendas',
      sortable: true,
      render: (row) => <div className="text-center"><span className="font-semibold">{formatNumber(row.total_vendas)}</span></div>
    },
    {
      key: 'total_valor',
      header: 'Valor Total',
      sortable: true,
      render: (row) => <div className="font-semibold text-green-600">{formatCurrency(row.total_valor)}</div>
    },
    {
      key: 'total_descontos',
      header: 'Descontos',
      sortable: true,
      render: (row) => <div className="text-orange-600">{formatCurrency(row.total_descontos)}</div>
    },
    {
      key: 'media_ticket',
      header: 'Ticket Médio',
      sortable: true,
      render: (row) => <div>{formatCurrency(row.media_ticket)}</div>
    }
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <User size={20} />
        Desempenho por Operador
      </h2>
      <DataTable columns={columns} data={data} pagination={false} striped />
    </div>
  )
}

export default UserSalesTable