import React from 'react'
import { Unlock, Clock, CheckCircle } from 'lucide-react'
import DataTable from '../ui/DataTable'
import Badge from '../Badge'
import { formatDateTime } from '../../utils/formatters'

const UnlockTable = ({ users, onUnlock }) => {
  const columns = [
    {
      key: 'email',
      header: 'Usuário',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {row.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.email}</p>
            <p className="text-xs text-gray-500">IP: {row.ip_address || 'N/A'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'attempts',
      header: 'Tentativas',
      sortable: true,
      render: (row) => (
        <div className="text-center">
          <span className={`font-semibold ${row.attempts >= 5 ? 'text-red-600' : 'text-orange-600'}`}>
            {row.attempts}/5
          </span>
        </div>
      )
    },
    {
      key: 'is_blocked',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <Badge variant={row.is_blocked ? 'danger' : 'success'}>
          {row.is_blocked ? (
            <><Clock size={12} className="mr-1" /> Bloqueado</>
          ) : (
            <><CheckCircle size={12} className="mr-1" /> Liberado</>
          )}
        </Badge>
      )
    },
    {
      key: 'blocked_until',
      header: 'Bloqueado até',
      render: (row) => (
        <div className="text-sm">
          {row.blocked_until ? (
            <span className="text-orange-600">{formatDateTime(row.blocked_until)}</span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'last_attempt',
      header: 'Última tentativa',
      render: (row) => (
        <span className="text-sm text-gray-600">{formatDateTime(row.last_attempt)}</span>
      )
    }
  ]

  const actions = [
    {
      label: 'Desbloquear',
      icon: <Unlock size={16} />,
      onClick: onUnlock,
      className: 'text-green-600 hover:text-green-800 hover:bg-green-50',
      disabled: (row) => !row.is_blocked
    }
  ]

  return (
    <DataTable
      columns={columns}
      data={users}
      actions={actions}
      emptyMessage="Nenhum usuário bloqueado"
      striped
      hover
      pagination
      itemsPerPageOptions={[20, 50, 100]}
      defaultItemsPerPage={20}
      showTotalItems
    />
  )
}

export default UnlockTable