import React from 'react'
import { Eye } from 'lucide-react'
import { useTableStrategy } from '../../hooks/useTableStrategy'
import { formatDateTime } from '../../utils/formatters'

const LogTable = ({ logs, onViewDetails, getActionColor, getActionLabel }) => {
  const TableComponent = useTableStrategy(logs, 100)

  const columns = [
    {
      key: 'created_at',
      header: 'Data/Hora',
      sortable: true,
      width: '160px',
      render: (row) => <div className="text-sm text-gray-500">{formatDateTime(row.created_at)}</div>
    },
    {
      key: 'user_email',
      header: 'Usuário',
      sortable: true,
      width: '20%',
      minWidth: '180px',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-medium text-gray-900 truncate">{row.user_email || 'Sistema'}</div>
          {row.user_role && <div className="text-xs text-gray-500 capitalize">{row.user_role}</div>}
        </div>
      )
    },
    {
      key: 'action',
      header: 'Ação',
      sortable: true,
      width: '120px',
      render: (row) => {
        const color = getActionColor(row.action)
        return <span className={`px-2 py-1 text-xs rounded-full ${color}`}>{getActionLabel(row.action)}</span>
      }
    },
    {
      key: 'entity_type',
      header: 'Entidade',
      sortable: true,
      width: '120px',
      render: (row) => <div className="text-sm text-gray-600 capitalize">{row.entity_type || '-'}</div>
    },
    {
      key: 'ip_address',
      header: 'IP',
      width: '130px',
      render: (row) => <div className="text-xs font-mono text-gray-500">{row.ip_address || '-'}</div>
    },
    {
      key: 'details',
      header: '',
      width: '60px',
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
    <TableComponent
      columns={columns}
      data={logs}
      actions={actions}
      onRowClick={onViewDetails}
      emptyMessage="Nenhum log encontrado"
      striped
      hover
      showTotalItems
    />
  )
}

export default LogTable