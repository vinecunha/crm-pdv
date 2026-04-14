import React, { useState } from 'react'
import { Edit2, Trash2, Shield, CheckCircle, Lock } from 'lucide-react'
import { useTableStrategy } from '../../hooks/useTableStrategy'
import UserRoleBadge from './UserRoleBadge'
import Badge from '../Badge'
import { formatDate } from '../../utils/formatters'
import { createAction } from '../../utils/actions'

const UserTable = ({ 
  users, 
  currentUserId,
  onEdit, 
  onDelete,
  onUpdateStatus,
  canEdit, 
  canDelete,
  isAdmin 
}) => {
  const TableComponent = useTableStrategy(users, 50)
  const [openMenuId, setOpenMenuId] = useState(null)

  const getStatusBadge = (status) => {
    const configs = {
      active: { label: 'Ativo', variant: 'success' },
      inactive: { label: 'Inativo', variant: 'warning' },
      blocked: { label: 'Bloqueado', variant: 'danger' },
      locked: { label: 'Bloqueado', variant: 'danger' }
    }
    const config = configs[status] || configs.active
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const columns = [
    {
      key: 'full_name',
      header: 'Nome',
      sortable: true,
      width: '25%',
      minWidth: '180px',
      render: (row) => (
        <div className="font-medium text-gray-900 truncate">
          {row.display_name || row.full_name || row.email?.split('@')[0]}
          {row.id === currentUserId && (
            <span className="ml-2 text-xs text-green-600">(Você)</span>
          )}
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      width: '25%',
      minWidth: '200px',
      render: (row) => <div className="text-sm text-gray-500 truncate">{row.email}</div>
    },
    {
      key: 'role',
      header: 'Papel',
      sortable: true,
      width: '120px',
      render: (row) => <UserRoleBadge role={row.role} size="sm" />
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (row) => getStatusBadge(row.status || 'active')
    },
    {
      key: 'created_at',
      header: 'Criado em',
      sortable: true,
      width: '120px',
      render: (row) => <div className="text-sm text-gray-500">{formatDate(row.created_at)}</div>
    }
  ]

  const actions = [
    {
      label: 'Status',
      icon: <Shield size={16} />,
      onClick: (row) => setOpenMenuId(openMenuId === row.id ? null : row.id),
      className: 'text-purple-600 hover:bg-purple-50',
      disabled: (row) => !isAdmin || row.id === currentUserId
    },
    createAction('edit', onEdit, {
      disabled: (row) => !canEdit || (!isAdmin && row.role === 'admin')
    }),
    createAction('delete', onDelete, {
      disabled: (row) => !canDelete || row.id === currentUserId || (!isAdmin && row.role === 'admin')
    })
  ]

  return (
    <>
      <TableComponent
        columns={columns}
        data={users}
        actions={actions}
        onRowClick={onEdit}
        emptyMessage="Nenhum usuário encontrado"
        striped
        hover
        showTotalItems
      />
      
      {openMenuId && (
        <StatusDropdown
          user={users.find(u => u.id === openMenuId)}
          onClose={() => setOpenMenuId(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </>
  )
}

const StatusDropdown = ({ user, onClose, onUpdateStatus }) => {
  const handleSelect = (newStatus) => {
    onUpdateStatus(user, newStatus)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
        {user.status !== 'active' && (
          <button
            onClick={() => handleSelect('active')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50"
          >
            <CheckCircle size={14} />
            Ativar
          </button>
        )}
        {user.status !== 'inactive' && (
          <button
            onClick={() => handleSelect('inactive')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50"
          >
            <Shield size={14} />
            Desativar
          </button>
        )}
        {user.status !== 'blocked' && user.status !== 'locked' && (
          <button
            onClick={() => handleSelect('blocked')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Lock size={14} />
            Bloquear
          </button>
        )}
      </div>
    </>
  )
}

export default UserTable