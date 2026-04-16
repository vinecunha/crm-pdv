import React, { useState } from 'react'
import { Edit2, Trash2, Shield, CheckCircle, Lock, User } from '../../lib/icons'
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
      key: 'registration_number',
      header: 'Matrícula',
      sortable: true,
      width: '130px',
      render: (row) => (
        <span className="font-mono text-sm text-gray-600 dark:text-gray-400">
          {row.registration_number || '-'}
        </span>
      )
    },
    {
      key: 'avatar',
      header: '',
      width: '60px',
      render: (row) => (
        <div className="flex items-center justify-center">
          {row.avatar_url ? (
            <img 
              src={row.avatar_url} 
              alt={row.full_name || row.email} 
              className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-sm"
              onError={(e) => {
                e.target.onerror = null
                e.target.style.display = 'none'
                e.target.nextSibling?.classList.remove('hidden')
              }}
            />
          ) : null}
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-medium shadow-sm bg-gradient-to-br ${
            row.role === 'admin' ? 'from-purple-500 to-purple-700 dark:from-purple-600 dark:to-purple-800' :
            row.role === 'gerente' ? 'from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600' :
            'from-gray-400 to-gray-600 dark:from-gray-500 dark:to-gray-700'
          } ${row.avatar_url ? 'hidden' : ''}`}>
            {(row.display_name || row.full_name || row.email?.charAt(0) || 'U').charAt(0).toUpperCase()}
          </div>
        </div>
      )
    },
    {
      key: 'full_name',
      header: 'Nome',
      sortable: true,
      width: '20%',
      minWidth: '160px',
      render: (row) => (
        <div className="font-medium text-gray-900 dark:text-white truncate">
          {row.display_name || row.full_name || row.email?.split('@')[0]}
          {row.id === currentUserId && (
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">(Você)</span>
          )}
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      width: '22%',
      minWidth: '180px',
      render: (row) => <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{row.email}</div>
    },
    {
      key: 'role',
      header: 'Papel',
      sortable: true,
      width: '110px',
      render: (row) => <UserRoleBadge role={row.role} size="sm" />
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '110px',
      render: (row) => getStatusBadge(row.status || 'active')
    },
    {
      key: 'created_at',
      header: 'Criado em',
      sortable: true,
      width: '110px',
      render: (row) => <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(row.created_at)}</div>
    }
  ]

  const actions = [
    {
      label: 'Status',
      icon: <Shield size={16} />,
      onClick: (row) => setOpenMenuId(openMenuId === row.id ? null : row.id),
      className: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30',
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
      <div className="absolute z-50 w-40 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
        {user.status !== 'active' && (
          <button
            onClick={() => handleSelect('active')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
          >
            <CheckCircle size={14} />
            Ativar
          </button>
        )}
        {user.status !== 'inactive' && (
          <button
            onClick={() => handleSelect('inactive')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/30"
          >
            <Shield size={14} />
            Desativar
          </button>
        )}
        {user.status !== 'blocked' && user.status !== 'locked' && (
          <button
            onClick={() => handleSelect('blocked')}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
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