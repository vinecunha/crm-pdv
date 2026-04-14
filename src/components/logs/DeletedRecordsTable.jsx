import React from 'react'
import { RotateCcw } from '../../lib/icons'
import DataTable from '../ui/DataTable'
import Badge from '../Badge'
import Button from '../ui/Button'
import { formatDateTime } from '../../utils/formatters'

const DeletedRecordsTable = ({ records, onRestore, canRestore }) => {
  const columns = [
    {
      key: '_type',
      header: 'Tipo',
      render: (row) => (
        <Badge variant={row._type === 'product' ? 'info' : 'purple'}>
          {row._typeLabel}
        </Badge>
      )
    },
    {
      key: 'name',
      header: 'Nome/Descrição',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-900">
            {row.name || row.full_name || row.code || '-'}
          </p>
          {row._type === 'product' && row.code && (
            <p className="text-xs text-gray-500">Código: {row.code}</p>
          )}
          {row._type === 'customer' && row.email && (
            <p className="text-xs text-gray-500">{row.email}</p>
          )}
        </div>
      )
    },
    {
      key: 'deleted_at',
      header: 'Excluído em',
      render: (row) => (
        <span className="text-sm text-gray-600">{formatDateTime(row.deleted_at)}</span>
      )
    },
    {
      key: 'deleted_by',
      header: 'Excluído por',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.deleter?.full_name || row.deleter?.email || '-'}
        </span>
      )
    }
  ]

  const actions = canRestore ? [
    {
      label: 'Restaurar',
      icon: <RotateCcw size={16} />,
      onClick: onRestore,
      className: 'text-green-600 hover:text-green-800 hover:bg-green-50'
    }
  ] : []

  return (
    <DataTable
      columns={columns}
      data={records}
      actions={actions}
      emptyMessage="Nenhum registro deletado"
      striped
      hover
      pagination
      itemsPerPageOptions={[20, 50, 100]}
      defaultItemsPerPage={20}
      showTotalItems
    />
  )
}

export default DeletedRecordsTable