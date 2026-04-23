// src/pages/Users.jsx
import React, { useState, useMemo } from 'react'
import { Plus, RefreshCw, Users as UsersIcon, Unlock, Search, CheckCircle, Lock, Shield } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import DataEmptyState from '@components/ui/DataEmptyState'
import DataCards from '@components/ui/DataCards'
import DataTable from '@components/ui/DataTable'
import Badge from '@components/Badge'
import PageHeader from '@components/ui/PageHeader'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import { formatDateTime } from '@utils/formatters'

import UserStats from '@components/users/UserStats'
import UserTable from '@components/users/UserTable'
import UserFilters from '@components/users/UserFilters'
import UserRoleBadge from '@components/users/UserRoleBadge'
import UsersModalsContainer from '@components/users/UsersModalsContainer'

// ✅ Hooks centralizados
import { useUsersHandlers } from '@hooks/handlers'
import { useUserMutations } from '@hooks/mutations'
import { useUsersQueries } from '@hooks/queries/useUsersQueries'
import { useUserForm } from '@hooks/forms/useUserForm'

const StatCard = ({ label, value, color, icon: Icon, active, onClick }) => {
  const colors = { 
    green: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-500 dark:border-green-400' }, 
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500 dark:border-yellow-400' }, 
    red: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-500 dark:border-red-400' } 
  }
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-4 sm:p-5 cursor-pointer transition-all hover:shadow-md ${active ? colors[color].border : 'border-gray-200 dark:border-gray-700'}`} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className={`text-xl sm:text-2xl font-bold ${colors[color].text}`}>{value}</p>
        </div>
        <div className={`p-2 sm:p-3 ${colors[color].bg} rounded-full`}>
          <Icon size={20} className={colors[color].text} />
        </div>
      </div>
    </div>
  )
}

const Users = () => {
  const { profile } = useAuth()
  const { logAction } = useSystemLogs()
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  // Estados de modais
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUnlockAllModal, setShowUnlockAllModal] = useState(false)
  
  // Estados de seleção
  const [editingUser, setEditingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  
  // Estados de busca/filtro (tab unlock)
  const [unlockSearchTerm, setUnlockSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('blocked')

  // Permissões
  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'gerente'
  const canCreateUser = isAdmin
  const canEditUser = isAdmin || isManager
  const canDeleteUser = isAdmin
  const canChangeRole = isAdmin

  // ✅ Queries centralizadas
  const {
    users,
    loadingUsers,
    refetchUsers,
    blockedUsers,
    loadingBlocked,
    refetchBlocked
  } = useUsersQueries({ filters, activeTab, isAdmin })

  // ✅ Form centralizado
  const {
    formData,
    setFormData,
    resetForm,
    setFormForEditing,
    getCreatePayload,
    getUpdatePayload
  } = useUserForm()

  // Feedback
  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  // ✅ Mutations com callbacks
  const {
    createMutation,
    updateMutation,
    updateStatusMutation,
    deleteMutation,
    unlockMutation,
    unlockAllMutation,
    isMutating
  } = useUserMutations({
    onUserCreated: () => {
      showFeedback('success', 'Usuário criado!')
      setShowModal(false)
      resetForm()
    },
    onUserUpdated: () => {
      showFeedback('success', 'Usuário atualizado!')
      setShowModal(false)
      resetForm()
    },
    onUserStatusUpdated: (data) => {
      const messages = { active: 'ativado', inactive: 'desativado', blocked: 'bloqueado' }
      showFeedback('success', `Usuário ${messages[data.status]}!`)
    },
    onUserDeleted: () => {
      showFeedback('success', `Usuário ${userToDelete?.full_name || userToDelete?.email} excluído!`)
      setShowDeleteModal(false)
      setUserToDelete(null)
    },
    onUserUnlocked: () => {
      showFeedback('success', 'Usuário desbloqueado!')
    },
    onAllUsersUnlocked: (count) => {
      showFeedback('success', `${count} usuários desbloqueados!`)
      setShowUnlockAllModal(false)
    },
    onError: (error) => {
      showFeedback('error', error.message || 'Erro na operação')
    }
  })

  // ✅ Handlers
  const handlers = useUsersHandlers({
    profile, isAdmin, isManager, canCreateUser, canEditUser, canDeleteUser, canChangeRole,
    editingUser, setEditingUser, userToDelete, setUserToDelete, formData, setFormData,
    searchTerm, setSearchTerm, filters, setFilters,
    unlockSearchTerm, setUnlockSearchTerm, statusFilter, setStatusFilter,
    showModal, setShowModal, showDeleteModal, setShowDeleteModal,
    showUnlockAllModal, setShowUnlockAllModal, blockedUsers: blockedUsers || [],
    createMutation, updateMutation, updateStatusMutation, deleteMutation,
    unlockMutation, unlockAllMutation, refetchUsers, refetchBlocked, showFeedback, logAction,
    resetForm, setFormForEditing, getCreatePayload, getUpdatePayload
  })

  // Usuários filtrados
  const filteredUsers = useMemo(() => {
    const usersArray = Array.isArray(users) ? users : []
    return usersArray.filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  // Bloqueados filtrados
  const filteredBlockedUsers = useMemo(() => {
    const blockedArray = Array.isArray(blockedUsers) ? blockedUsers : []
    let filtered = [...blockedArray]
    if (statusFilter === 'blocked') filtered = filtered.filter(u => u.status === 'blocked' || u.status === 'locked')
    else if (statusFilter !== 'all') filtered = filtered.filter(u => u.status === statusFilter)
    if (unlockSearchTerm.trim()) {
      const search = unlockSearchTerm.toLowerCase()
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(search) || 
        u.full_name?.toLowerCase().includes(search) || 
        u.display_name?.toLowerCase().includes(search) ||
        u.registration_number?.toLowerCase().includes(search)
      )
    }
    return filtered
  }, [blockedUsers, unlockSearchTerm, statusFilter])

  // Renderização de cards
  const renderUserCard = (user) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <UserRoleBadge role={user.role} size="sm" />
        {user.id === profile?.id && (
          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs">Você</span>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">{user.registration_number || 'Sem matrícula'}</p>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">{user.full_name || user.email?.split('@')[0]}</h3>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 break-all">{user.email}</p>
      <div className="flex gap-2 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
        {canEditUser && (!isAdmin ? user.role !== 'admin' : true) && (
          <button onClick={() => handlers.handleEdit(user)} className="flex-1 py-1.5 sm:py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 text-xs sm:text-sm">Editar</button>
        )}
        {canDeleteUser && user.id !== profile?.id && (!isAdmin ? user.role !== 'admin' : true) && (
          <button onClick={() => handlers.handleDeleteClick(user)} className="flex-1 py-1.5 sm:py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/50 text-xs sm:text-sm">Excluir</button>
        )}
      </div>
    </div>
  )

  // Colunas da tabela de desbloqueio
  const unlockColumns = [
    { key: 'registration_number', header: 'Matrícula', render: (row) => <span className="font-mono text-xs sm:text-sm text-gray-600 dark:text-gray-400">{row.registration_number || '-'}</span> },
    { key: 'email', header: 'Usuário', render: (row) => (
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${row.status === 'active' ? 'bg-gradient-to-br from-green-500 to-green-600' : row.status === 'inactive' ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
          {row.email?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{row.display_name || row.full_name || row.email?.split('@')[0]}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.email}</p>
        </div>
      </div>
    )},
    { key: 'role', header: 'Função', render: (row) => (<Badge variant={row.role === 'admin' ? 'purple' : row.role === 'gerente' ? 'info' : 'default'} size="sm">{row.role === 'admin' ? 'Admin' : row.role === 'gerente' ? 'Gerente' : 'Operador'}</Badge>) },
    { key: 'status', header: 'Status', render: (row) => { const config = handlers.getStatusBadge(row.status); return <Badge variant={config.variant} size="sm">{config.label}</Badge> }},
    { key: 'last_login', header: 'Último Acesso', render: (row) => <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{row.last_login ? formatDateTime(row.last_login) : 'Nunca'}</span> }
  ]

  const unlockActions = [{ 
    label: 'Desbloquear', icon: <Unlock size={16} />, onClick: handlers.handleUnlockUser, 
    className: 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30', 
    disabled: (row) => row.status === 'active' || row.id === profile?.id 
  }]

  const tabs = [
    { id: 'users', label: 'Usuários', icon: UsersIcon },
    ...(isAdmin ? [{ id: 'unlock', label: 'Desbloqueio', icon: Unlock, badge: handlers.unlockStats.totalBlocked }] : [])
  ]

  const getHeaderActions = () => {
    if (activeTab === 'users') {
      return [
        { label: 'Atualizar', icon: RefreshCw, onClick: () => refetchUsers(), loading: loadingUsers, variant: 'outline' },
        ...(canCreateUser ? [{ label: 'Novo Usuário', icon: Plus, onClick: handlers.handleOpenCreateModal, variant: 'primary', disabled: isMutating }] : [])
      ]
    }
    return [
      { label: 'Atualizar', icon: RefreshCw, onClick: () => refetchBlocked(), loading: loadingBlocked, variant: 'outline' },
      ...(handlers.unlockStats.totalBlocked > 0 ? [{ label: `Desbloquear Todos (${handlers.unlockStats.totalBlocked})`, icon: Unlock, onClick: () => setShowUnlockAllModal(true), variant: 'success', disabled: isMutating }] : [])
    ]
  }

  if (!canCreateUser && !canEditUser) {
    return <DataEmptyState title="Acesso Restrito" description="Você não tem permissão para acessar esta página." icon="users" />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}
        
        <PageHeader title="Usuários" description="Gerencie os usuários e acessos do sistema" icon={UsersIcon} actions={getHeaderActions()} />

        <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
          <nav className="flex gap-4 sm:gap-6 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`pb-2 sm:pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                  <Icon size={14} />{tab.label}
                  {tab.badge > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[10px] sm:text-xs font-bold">{tab.badge}</span>}
                </button>
              )
            })}
          </nav>
        </div>

        {activeTab === 'users' && (
          <>
            <UserStats users={users} />
            <UserFilters searchTerm={searchTerm} setSearchTerm={handlers.setSearchTerm} filters={filters} setFilters={handlers.setFilters} />
            {loadingUsers && <DataLoadingSkeleton />}
            {!loadingUsers && filteredUsers.length === 0 && <DataEmptyState title="Nenhum usuário encontrado" description={searchTerm || filters.role ? "Tente ajustar os filtros" : "Clique em 'Novo Usuário' para adicionar"} icon="users" />}
            {!loadingUsers && filteredUsers.length > 0 && (
              <>
                <div className="block lg:hidden"><DataCards data={filteredUsers} renderCard={renderUserCard} keyExtractor={(u) => u.id} columns={1} gap={2} /></div>
                <div className="hidden lg:block"><UserTable users={filteredUsers} currentUserId={profile?.id} onEdit={handlers.handleEdit} onDelete={handlers.handleDeleteClick} onUpdateStatus={handlers.handleUpdateStatus} canEdit={canEditUser} canDelete={canDeleteUser} isAdmin={isAdmin} /></div>
              </>
            )}
          </>
        )}

        {activeTab === 'unlock' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <StatCard label="Bloqueados" value={handlers.unlockStats.totalBlocked} color="red" icon={Lock} active={statusFilter === 'blocked'} onClick={() => handlers.setStatusFilter('blocked')} />
              <StatCard label="Inativos" value={handlers.unlockStats.totalInactive} color="yellow" icon={Shield} active={statusFilter === 'inactive'} onClick={() => handlers.setStatusFilter('inactive')} />
              <StatCard label="Ativos" value={handlers.unlockStats.totalActive} color="green" icon={CheckCircle} active={statusFilter === 'active'} onClick={() => handlers.setStatusFilter('active')} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input type="text" placeholder="Buscar por nome ou email..." value={unlockSearchTerm} onChange={(e) => handlers.setUnlockSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg" />
                </div>
                <select value={statusFilter} onChange={(e) => handlers.setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg">
                  <option value="blocked">Bloqueados</option>
                  <option value="inactive">Inativos</option>
                  <option value="active">Ativos</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            </div>
            {loadingBlocked && <DataLoadingSkeleton />}
            {!loadingBlocked && filteredBlockedUsers.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 sm:p-12 text-center">
                <CheckCircle size={40} className="text-green-400 dark:text-green-500 mx-auto mb-3 sm:size-48" />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">{statusFilter === 'blocked' ? 'Nenhum usuário bloqueado!' : 'Nenhum usuário encontrado'}</p>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">{statusFilter === 'blocked' ? 'Todos os usuários podem acessar o sistema' : 'Tente ajustar os filtros'}</p>
              </div>
            ) : !loadingBlocked && (
              <DataTable columns={unlockColumns} data={filteredBlockedUsers} actions={unlockActions} striped hover pagination itemsPerPageOptions={[20, 50, 100]} defaultItemsPerPage={20} showTotalItems />
            )}
          </>
        )}

        <UsersModalsContainer
          showModal={showModal}
          onCloseModal={handlers.handleCloseModal}
          editingUser={editingUser}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handlers.handleSubmit}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          canChangeRole={canChangeRole}
          showDeleteModal={showDeleteModal}
          onCloseDeleteModal={handlers.handleCloseDeleteModal}
          userToDelete={userToDelete}
          onConfirmDelete={handlers.handleDelete}
          isDeleting={deleteMutation.isPending}
          showUnlockAllModal={showUnlockAllModal}
          onCloseUnlockAllModal={handlers.handleCloseUnlockAllModal}
          onConfirmUnlockAll={handlers.handleUnlockAll}
          isUnlockingAll={unlockAllMutation.isPending}
          unlockStats={handlers.unlockStats}
        />
      </div>
    </div>
  )
}

export default Users
