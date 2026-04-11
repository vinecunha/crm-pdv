import React from 'react'
import { Eye } from 'lucide-react'
import DataTable from '../ui/DataTable'
import { formatDateTime } from '../../utils/formatters'

const LogTable = ({ logs, onViewDetails, getActionColor, getActionLabel }) => {
  const columns = [
    {
      key: 'created_at',
      header: 'Data/Hora',
      sortable: true,
      render: (row) => <div className="text-sm text-gray-500">{formatDateTime(row.created_at)}</div>
    },
    {
      key: 'user_email',
      header: 'Usuário',
      sortable: true,
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.user_email || 'Sistema'}</div>
          {row.user_role && <div className="text-xs text-gray-500 capitalize">{row.user_role}</div>}
        </div>
      )
    },
    {
      key: 'action',
      header: 'Ação',
      sortable: true,
      render: (row) => {
        const color = getActionColor(row.action)
        return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{getActionLabel(row.action)}</span>
      }
    },
    {
      key: 'entity_type',
      header: 'Entidade',
      sortable: true,
      render: (row) => <div className="text-sm text-gray-600 capitalize">{row.entity_type || '-'}</div>
    },
    {
      key: 'ip_address',
      header: 'IP',
      render: (row) => <div className="text-xs font-mono text-gray-500">{row.ip_address || '-'}</div>
    },
    {
      key: 'details',
      header: '',
      render: (row) => (
        <button onClick={() => onViewDetails(row)} className="text-blue-600 hover:text-blue-800">
          <Eye size={16} />
        </button>
      )
    }
  ]

  const actions = [
    {
      label: 'Ver detalhes',
      icon: <Eye size={16} />,
      onClick: onViewDetails,
      className: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
    }
  ]

  return (
    <DataTable
      columns={columns}
      data={logs}
      actions={actions}
      onRowClick={onViewDetails}
      emptyMessage="Nenhum log encontrado"
      striped
      hover
      pagination
      itemsPerPageOptions={[20, 50, 100]}
      defaultItemsPerPage={20}
      showTotalItems
    />
  )
}

export default LogTable