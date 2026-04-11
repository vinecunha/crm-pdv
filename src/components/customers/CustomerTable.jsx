import React from 'react'
import { User, Trash, Mail } from 'lucide-react'
import DataTable from '../ui/DataTable'
import Badge from '../Badge'
import { formatCurrency, formatDate } from '../../utils/formatters'

const CustomerTable = ({ 
  customers, 
  onEdit, 
  onDelete, 
  onCommunicate 
}) => {
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
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.name || '-'}</div>
            <div className="text-xs text-gray-500">{row.email || '-'}</div>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      header: 'Telefone',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Trash size={14} className="text-gray-400" />
          <span>{row.phone || '-'}</span>
        </div>
      )
    },
    {
      key: 'document',
      header: 'CPF/CNPJ',
      render: (row) => row.document || '-'
    },
    {
      key: 'total_purchases',
      header: 'Total em Compras',
      sortable: true,
      render: (row) => (
        <span className="font-medium text-green-600">
          {formatCurrency(row.total_purchases)}
        </span>
      )
    },
    {
      key: 'last_purchase',
      header: 'Última Compra',
      sortable: true,
      render: (row) => formatDate(row.last_purchase)
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => getStatusBadge(row.status)
    }
  ]

  const actions = [
    {
      label: 'Comunicar',
      icon: <Mail size={16} />,
      onClick: onCommunicate,
      className: 'text-green-600 hover:text-green-700 hover:bg-green-50'
    },
    {
      label: 'Editar',
      icon: <User size={16} />,
      onClick: onEdit,
      className: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
    },
    {
      label: 'Excluir',
      icon: <Trash size={16} />,
      onClick: onDelete,
      className: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    }
  ]

  return (
    <DataTable
      columns={columns}
      data={customers}
      actions={actions}
      onRowClick={onEdit}
      striped
      hover
      pagination
      itemsPerPageOptions={[20, 50, 100]}
      defaultItemsPerPage={20}
    />
  )
}

export default CustomerTable