import React, { useState, useMemo, useCallback } from 'react'
import { 
  Edit2, 
  Trash2, 
  Shield, 
  CheckCircle, 
  Lock, 
  User,
  Mail,
  Calendar,
  Users as UsersIcon,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCw,
  Download,
  Key,
  Unlock
} from '@lib/icons'
import { useTableStrategy } from '@hooks/utils/useTableStrategy'
import UserRoleBadge from '@components/users/UserRoleBadge'
import Badge from '../Badge'
import { formatDate } from '@utils/formatters'
import { createAction } from '@utils/actions'

const UserTable = ({ 
  users, 
  currentUserId,
  onEdit, 
  onDelete,
  onUpdateStatus,
  canEdit, 
  canDelete,
  isAdmin,
  
  // Novas props opcionais
  onRefresh,
  onExport,
  onResetPassword,
  onUnlock,
  loading = false,
  enableSearch = true,
  enableExport = true,
  enableRefresh = true,
  enableSelection = false,
  onSelectionChange,
  compact = false,
  showSummary = true
}) => {
  const TableComponent = useTableStrategy(users, 50)
  const [openMenuId, setOpenMenuId] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const safeUsers = Array.isArray(users) ? users : []

  // Status badge
  const getStatusBadge = useCallback((status) => {
    const configs = {
      active: { label: 'Ativo', variant: 'success', icon: CheckCircle },
      inactive: { label: 'Inativo', variant: 'warning', icon: Shield },
      blocked: { label: 'Bloqueado', variant: 'danger', icon: Lock },
      locked: { label: 'Bloqueado', variant: 'danger', icon: Lock }
    }
    const config = configs[status] || configs.active
    const Icon = config.icon
    return (
      <Badge variant={config.variant}>
        <Icon size={10} className="mr-1" />
        {config.label}
      </Badge>
    )
  }, [])

  // Estatísticas
  const stats = useMemo(() => {
    if (!safeUsers.length) return null
    
    const total = safeUsers.length
    const active = safeUsers.filter(u => u.status === 'active').length
    const inactive = safeUsers.filter(u => u.status === 'inactive').length
    const blocked = safeUsers.filter(u => u.status === 'blocked' || u.status === 'locked').length
    const admins = safeUsers.filter(u => u.role === 'admin').length
    const managers = safeUsers.filter(u => u.role === 'gerente').length
    const regular = safeUsers.filter(u => u.role === 'user' || !u.role).length
    
    return {
      total,
      active,
      inactive,
      blocked,
      admins,
      managers,
      regular
    }
  }, [safeUsers])

  // Colunas
  const columns = useMemo(() => [
    {
      key: 'registration_number',
      header: 'Matrícula',
      sortable: true,
      searchable: true,
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
      searchable: true,
      minWidth: '180px',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900 dark:text-white truncate">
            {row.display_name || row.full_name || row.email?.split('@')[0]}
          </div>
          {row.id === currentUserId && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5">
              <User size={10} />
              Você
            </span>
          )}
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      searchable: true,
      minWidth: '200px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <Mail size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500 dark:text-gray-400 truncate">{row.email}</span>
        </div>
      )
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
      render: (row) => (
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(row.created_at)}</span>
        </div>
      )
    },
    {
      key: 'last_login',
      header: 'Último Acesso',
      sortable: true,
      width: '130px',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {row.last_login ? formatDate(row.last_login) : 'Nunca acessou'}
        </span>
      )
    }
  ], [currentUserId, getStatusBadge])

  // Ações
  const actions = useMemo(() => {
    const baseActions = [
      {
        id: 'status',
        label: 'Status',
        icon: Shield,
        onClick: (row) => setOpenMenuId(openMenuId === row.id ? null : row.id),
        className: 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30',
        disabled: (row) => !isAdmin || row.id === currentUserId
      },
      createAction('edit', onEdit, {
        disabled: (row) => !canEdit || (!isAdmin && row.role === 'admin'),
        className: 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
      })
    ]
    
    // Adicionar ação de reset de senha se disponível
    if (onResetPassword) {
      baseActions.push({
        id: 'reset-password',
        label: 'Resetar Senha',
        icon: Key,
        onClick: onResetPassword,
        className: 'text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30',
        disabled: (row) => !isAdmin && row.id !== currentUserId
      })
    }
    
    // Adicionar ação de desbloquear se disponível
    if (onUnlock) {
      baseActions.push({
        id: 'unlock',
        label: 'Desbloquear',
        icon: Unlock,
        onClick: onUnlock,
        className: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30',
        show: (row) => row.status === 'locked' || row.status === 'blocked',
        disabled: (row) => !isAdmin
      })
    }
    
    // Ação de excluir
    baseActions.push(
      createAction('delete', onDelete, {
        disabled: (row) => !canDelete || row.id === currentUserId || (!isAdmin && row.role === 'admin'),
        className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
      })
    )
    
    return baseActions
  }, [onEdit, onDelete, onResetPassword, onUnlock, canEdit, canDelete, isAdmin, currentUserId, openMenuId])

  // Campos para busca
  const searchFields = useMemo(() => 
    columns
      .filter(col => col.searchable)
      .map(col => col.key)
  , [columns])

  // Handlers
  const handleSelectionChange = useCallback((selectedIds) => {
    setSelectedUsers(selectedIds)
    onSelectionChange?.(selectedIds)
  }, [onSelectionChange])

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh()
    }
  }, [onRefresh])

  const exportFilename = useMemo(() => {
    const date = new Date().toISOString().split('T')[0]
    return `usuarios-${date}.csv`
  }, [])

  return (
    <div className="space-y-4">
      {/* Tabela principal */}
      <TableComponent
        // Props existentes
        columns={columns}
        data={safeUsers}
        actions={actions}
        onRowClick={onEdit}
        emptyMessage="Nenhum usuário encontrado"
        striped
        hover
        showTotalItems
        
        // Novas funcionalidades
        id="tabela-usuarios"
        // searchable={enableSearch}
        // searchPlaceholder="Buscar por nome, email, matrícula..."
        // searchFields={searchFields}
        exportable={enableExport}
        exportFilename={exportFilename}
        refreshable={enableRefresh && !!onRefresh}
        onRefresh={handleRefresh}
        loading={loading}
        selectable={enableSelection}
        onSelectionChange={handleSelectionChange}
        compact={compact}
        stickyHeader={true}
        itemsPerPageOptions={[10, 20, 50, 100]}
      />
      
      {/* Dropdown de status */}
      {openMenuId && (
        <StatusDropdown
          user={safeUsers.find(u => u.id === openMenuId)}
          onClose={() => setOpenMenuId(null)}
          onUpdateStatus={onUpdateStatus}
          onResetPassword={onResetPassword}
          onUnlock={onUnlock}
        />
      )}

      {/* Ações em massa */}
      {enableSelection && selectedUsers.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {selectedUsers.length} usuário{selectedUsers.length > 1 ? 's' : ''} selecionado{selectedUsers.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const selected = safeUsers.filter(u => selectedUsers.includes(u.id))
                selected.forEach(u => onUpdateStatus(u, 'active'))
              }}
              className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <CheckCircle size={14} />
              Ativar selecionados
            </button>
            <button
              onClick={() => {
                const selected = safeUsers.filter(u => selectedUsers.includes(u.id))
                selected.forEach(u => onUpdateStatus(u, 'inactive'))
              }}
              className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors flex items-center gap-1"
            >
              <Shield size={14} />
              Desativar selecionados
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Dropdown de Status atualizado
const StatusDropdown = ({ user, onClose, onUpdateStatus, onResetPassword, onUnlock }) => {
  const handleSelect = (newStatus) => {
    onUpdateStatus(user, newStatus)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute z-50 w-44 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
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
        
        {/* Opções adicionais */}
        {(user.status === 'locked' || user.status === 'blocked') && onUnlock && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => {
                onUnlock(user)
                onClose()
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            >
              <Unlock size={14} />
              Desbloquear
            </button>
          </>
        )}
        
        {onResetPassword && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
            <button
              onClick={() => {
                onResetPassword(user)
                onClose()
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30"
            >
              <Key size={14} />
              Resetar senha
            </button>
          </>
        )}
      </div>
    </>
  )
}

export default UserTable
