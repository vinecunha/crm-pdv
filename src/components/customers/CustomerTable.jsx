import React from 'react'
import { User, Phone } from 'lucide-react'
import { useTableStrategy } from '../../hooks/useTableStrategy'
import Badge from '../Badge'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { createAction } from '../../utils/actions'

const CustomerTable = ({ customers, onEdit, onDelete, onCommunicate }) => {
  const TableComponent = useTableStrategy(customers, 100)

  const getStatusBadge = (status) => {
    return status === 'active' 
      ? <Badge variant="success">Ativo</Badge>
      : <Badge variant="danger">Inativo</Badge>
  }

  const columns = [
    {
      key: 'name',
      header: 'Cliente',
      sortable: true,
      width: '25%',
      minWidth: '200px',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">{row.name || '-'}</div>
            <div className="text-xs text-gray-500 truncate">{row.email || '-'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Telefone',
      width: '150px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{row.phone || '-'}</span>
        </div>
      )
    },
    {
      key: 'document',
      header: 'CPF/CNPJ',
      width: '150px',
      render: (row) => <span className="truncate">{row.document || '-'}</span>
    },
    {
      key: 'total_purchases',
      header: 'Total em Compras',
      sortable: true,
      width: '150px',
      render: (row) => (
        <span className="font-medium text-green-600">{formatCurrency(row.total_purchases)}</span>
      )
    },
    {
      key: 'last_purchase',
      header: 'Última Compra',
      sortable: true,
      width: '130px',
      render: (row) => formatDate(row.last_purchase)
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => getStatusBadge(row.status)
    }
  ]

  const actions = [
    createAction('communicate', onCommunicate),
    createAction('edit', onEdit),
    createAction('delete', onDelete)
  ]

  return (
    <TableComponent
      columns={columns}
      data={customers}
      actions={actions}
      onRowClick={onEdit}
      emptyMessage="Nenhum cliente encontrado"
      striped
      hover
      showTotalItems
    />
  )
}

export default CustomerTable