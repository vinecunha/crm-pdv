// src/pages/Users.jsx
import React, { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, RefreshCw, Users as UsersIcon, Unlock, Search, CheckCircle, Lock, Shield, AlertTriangle } from '../lib/icons'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import DataCards from '../components/ui/DataCards'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/Badge'
import PageHeader from '../components/ui/PageHeader'
import useSystemLogs from '../hooks/useSystemLogs'
import { formatDateTime } from '../utils/formatters'

import * as userService from '../services/userService'

import UserStats from '../components/users/UserStats'
import UserForm from '../components/users/UserForm'
import UserTable from '../components/users/UserTable'
import UserFilters from '../components/users/UserFilters'
import UserDeleteModal from '../components/users/UserDeleteModal'
import UserRoleBadge from '../components/users/UserRoleBadge'

const StatCard = ({ label, value, color, icon: Icon, active, onClick }) => {
  const colors = { 
    green: { bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-500 dark:border-green-400' }, 
    yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-500 dark:border-yellow-400' }, 
    red: { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-500 dark:border-red-400' } 
  }
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border-2 p-4 sm:p-5 cursor-pointer transition-all hover:shadow-md dark:hover:shadow-gray-900/50 ${active ? colors[color].border : 'border-gray-200 dark:border-gray-700'}`} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className={`text-xl sm:text-2xl font-bold ${colors[color].text}`}>{value}</p>
        </div>
        <div className={`p-2 sm:p-3 ${colors[color].bg} rounded-full`}>
          <Icon size={20} className={`${colors[color].text}`} />
        </div>
      </div>
    </div>
  )
}

const Users = () => {
  const { profile } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('users')
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [formData, setFormData] = useState({ 
    email: '', 
    full_name: '', 
    role: 'operador', 
    password: '',
    registration_number: ''
  })
  
  const [unlockSearchTerm, setUnlockSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('blocked')
  const [showUnlockAllModal, setShowUnlockAllModal] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'gerente'
  const canCreateUser = isAdmin
  const canEditUser = isAdmin || isManager
  const canDeleteUser = isAdmin
  const canChangeRole = isAdmin

  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['users', { filters }],
    queryFn: () => userService.fetchUsers(filters),
    enabled: activeTab === 'users',
  })

  const { data: blockedUsers = [], isLoading: loadingBlocked, refetch: refetchBlocked } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: userService.fetchBlockedUsers,
    enabled: activeTab === 'unlock' && isAdmin,
  })

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: async (user) => {
      await logCreate('user', user.id, { email: formData.email, full_name: formData.full_name, role: formData.role, registration_number: formData.registration_number })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showFeedback('success', 'Usuário criado!')
      setShowModal(false)
      resetForm()
    },
    onError: async (error) => { showFeedback('error', error.message || 'Erro ao criar usuário'); await logError('user', error, { action: 'create' }) }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: async (data) => {
      await logUpdate('user', data.id, editingUser, data)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      showFeedback('success', 'Usuário atualizado!')
      setShowModal(false)
      resetForm()
    },
    onError: async (error) => { showFeedback('error', error.message || 'Erro ao atualizar usuário'); await logError('user', error, { action: 'update' }) }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => userService.updateUserStatus(id, status),
    onSuccess: async (data, variables) => {
      await logAction({ action: 'UPDATE_USER_STATUS', entityType: 'profile', entityId: data.id, details: { old_status: variables.oldStatus, new_status: data.status, updated_by: profile?.email } })
      queryClient.invalidateQueries({ queryKey: ['users'] }); queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      const messages = { active: 'ativado', inactive: 'desativado', blocked: 'bloqueado' }
      showFeedback('success', `Usuário ${messages[data.status]}!`)
    },
    onError: (error) => showFeedback('error', 'Erro ao atualizar status: ' + error.message)
  })

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: async (id) => {
      await logDelete('user', id, userToDelete)
      queryClient.invalidateQueries({ queryKey: ['users'] }); queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      showFeedback('success', `Usuário ${userToDelete?.full_name || userToDelete?.email} excluído!`)
      setShowDeleteModal(false); setUserToDelete(null)
    },
    onError: (error) => showFeedback('error', error.message)
  })

  const unlockMutation = useMutation({
    mutationFn: (id) => userService.updateUserStatus(id, 'active'),
    onSuccess: async (data) => {
      await logAction({ action: 'UNLOCK_USER', entityType: 'profile', entityId: data.id, details: { unlocked_by: profile?.email } })
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      showFeedback('success', `Usuário desbloqueado!`)
    },
    onError: (error) => showFeedback('error', 'Erro ao desbloquear usuário')
  })

  const unlockAllMutation = useMutation({
    mutationFn: userService.unlockAllUsers,
    onSuccess: async (count) => {
      await logAction({ action: 'UNLOCK_ALL_USERS', entityType: 'profile', details: { unlocked_by: profile?.email, count } })
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      showFeedback('success', `${count} usuários desbloqueados!`)
      setShowUnlockAllModal(false)
    },
    onError: (error) => showFeedback('error', 'Erro ao desbloquear usuários')
  })

  const filteredUsers = useMemo(() => {
    const usersArray = Array.isArray(users) ? users : []
    return usersArray.filter(user => 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.registration_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

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

  const unlockStats = useMemo(() => ({
    totalActive: blockedUsers.filter(u => u.status === 'active').length,
    totalInactive: blockedUsers.filter(u => u.status === 'inactive').length,
    totalBlocked: blockedUsers.filter(u => u.status === 'blocked' || u.status === 'locked').length
  }), [blockedUsers])

  const showFeedback = (type, message) => { setFeedback({ show: true, type, message }); setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000) }
  
  const resetForm = () => { 
    setEditingUser(null)
    setFormData({ email: '', full_name: '', role: 'operador', password: '', registration_number: '' }) 
  }
  
  const handleEdit = (user) => { 
    setEditingUser(user)
    setFormData({ 
      email: user.email, 
      full_name: user.full_name || '', 
      role: user.role || 'operador', 
      password: '',
      registration_number: user.registration_number || ''
    })
    setShowModal(true) 
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingUser) {
      const updateData = { full_name: formData.full_name }
      if (canChangeRole) updateData.role = formData.role
      updateMutation.mutate({ id: editingUser.id, data: updateData })
    } else {
      if (!formData.email || !formData.password || !formData.full_name) { 
        showFeedback('error', 'Preencha todos os campos obrigatórios')
        return 
      }
      createMutation.mutate({ 
        email: formData.email, 
        password: formData.password, 
        full_name: formData.full_name, 
        role: canChangeRole ? formData.role : 'operador',
        registration_number: formData.registration_number
      })
    }
  }

  const handleDelete = () => { if (!userToDelete) return; deleteMutation.mutate(userToDelete.id) }
  const handleUpdateStatus = (user, newStatus) => updateStatusMutation.mutate({ id: user.id, status: newStatus, oldStatus: user.status || 'active' })
  const handleUnlockUser = (user) => unlockMutation.mutate(user.id)
  const handleUnlockAll = () => { 
    const blockedIds = blockedUsers.filter(u => u.status === 'blocked' || u.status === 'locked').map(u => u.id)
    unlockAllMutation.mutate(blockedIds) 
  }

  const getStatusBadge = (status) => {
    const configs = { 
      active: { label: 'Ativo', variant: 'success', icon: CheckCircle }, 
      inactive: { label: 'Inativo', variant: 'warning', icon: Shield }, 
      blocked: { label: 'Bloqueado', variant: 'danger', icon: Lock }, 
      locked: { label: 'Bloqueado', variant: 'danger', icon: Lock } 
    }
    const config = configs[status] || configs.active
    const Icon = config.icon
    return <Badge variant={config.variant} size="sm"><Icon size={12} className="mr-1" />{config.label}</Badge>
  }

  const unlockColumns = [
    { 
      key: 'registration_number', 
      header: 'Matrícula', 
      render: (row) => <span className="font-mono text-xs sm:text-sm text-gray-600 dark:text-gray-400">{row.registration_number || '-'}</span> 
    },
    { 
      key: 'email', 
      header: 'Usuário', 
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${
            row.status === 'active' ? 'bg-gradient-to-br from-green-500 to-green-600' : 
            row.status === 'inactive' ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 
            'bg-gradient-to-br from-red-500 to-red-600'
          }`}>
            {row.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{row.display_name || row.full_name || row.email?.split('@')[0]}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{row.email}</p>
          </div>
        </div>
      ) 
    },
    { 
      key: 'role', 
      header: 'Função', 
      render: (row) => (
        <Badge variant={row.role === 'admin' ? 'purple' : row.role === 'gerente' ? 'info' : 'default'} size="sm">
          {row.role === 'admin' ? 'Admin' : row.role === 'gerente' ? 'Gerente' : 'Operador'}
        </Badge>
      ) 
    },
    { key: 'status', header: 'Status', render: (row) => getStatusBadge(row.status) },
    { 
      key: 'last_login', 
      header: 'Último Acesso', 
      render: (row) => <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{row.last_login ? formatDateTime(row.last_login) : 'Nunca'}</span> 
    }
  ]

  const unlockActions = [{ 
    label: 'Desbloquear', 
    icon: <Unlock size={16} />, 
    onClick: handleUnlockUser, 
    className: 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30', 
    disabled: (row) => row.status === 'active' || row.id === profile?.id 
  }]

  const renderUserCard = (user) => (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow">
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <UserRoleBadge role={user.role} size="sm" />
        {user.id === profile?.id && <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs">Você</span>}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">{user.registration_number || 'Sem matrícula'}</p>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2 text-sm sm:text-base">{user.full_name || user.email?.split('@')[0]}</h3>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-3 break-all">{user.email}</p>
      <div className="flex gap-2 pt-2 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
        {canEditUser && (!isAdmin ? user.role !== 'admin' : true) && (
          <button onClick={() => handleEdit(user)} className="flex-1 py-1.5 sm:py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/50 text-xs sm:text-sm">Editar</button>
        )}
        {canDeleteUser && user.id !== profile?.id && (!isAdmin ? user.role !== 'admin' : true) && (
          <button onClick={() => { setUserToDelete(user); setShowDeleteModal(true) }} className="flex-1 py-1.5 sm:py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/50 text-xs sm:text-sm">Excluir</button>
        )}
      </div>
    </div>
  )

  const tabs = [
    { id: 'users', label: 'Usuários', icon: UsersIcon },
    ...(isAdmin ? [{ id: 'unlock', label: 'Desbloqueio', icon: Unlock, badge: unlockStats.totalBlocked }] : [])
  ]

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending || updateStatusMutation.isPending || unlockMutation.isPending || unlockAllMutation.isPending

  // Configuração das ações do header
  const getHeaderActions = () => {
    if (activeTab === 'users') {
      return [
        {
          label: 'Atualizar',
          icon: RefreshCw,
          onClick: () => refetchUsers(),
          loading: loadingUsers,
          variant: 'outline'
        },
        ...(canCreateUser ? [{
          label: 'Novo Usuário',
          icon: Plus,
          onClick: () => { resetForm(); setShowModal(true) },
          variant: 'primary',
          disabled: isMutating
        }] : [])
      ]
    } else {
      return [
        {
          label: 'Atualizar',
          icon: RefreshCw,
          onClick: () => refetchBlocked(),
          loading: loadingBlocked,
          variant: 'outline'
        },
        ...(unlockStats.totalBlocked > 0 ? [{
          label: `Desbloquear Todos (${unlockStats.totalBlocked})`,
          icon: Unlock,
          onClick: () => setShowUnlockAllModal(true),
          variant: 'success',
          disabled: isMutating
        }] : [])
      ]
    }
  }

  if (!canCreateUser && !canEditUser) return <DataEmptyState title="Acesso Restrito" description="Você não tem permissão para acessar esta página." icon="users" />

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {feedback.show && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />}
        
        <PageHeader
          title="Usuários"
          description="Gerencie os usuários e acessos do sistema"
          icon={UsersIcon}
          actions={getHeaderActions()}
        />

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-4 sm:mb-6">
          <nav className="flex gap-4 sm:gap-6 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id)} 
                  className={`pb-2 sm:pb-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap ${activeTab === tab.id ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
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
            <UserFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} filters={filters} setFilters={setFilters} />
            {loadingUsers && <DataLoadingSkeleton />}
            {!loadingUsers && filteredUsers.length === 0 && <DataEmptyState title="Nenhum usuário encontrado" description={searchTerm || filters.role ? "Tente ajustar os filtros" : "Clique em 'Novo Usuário' para adicionar"} icon="users" />}
            {!loadingUsers && filteredUsers.length > 0 && (
              <>
                <div className="block lg:hidden"><DataCards data={filteredUsers} renderCard={renderUserCard} keyExtractor={(u) => u.id} columns={1} gap={2} /></div>
                  <div className="hidden lg:block">
                    <UserTable 
                      users={filteredUsers} 
                      currentUserId={profile?.id} 
                      onEdit={handleEdit} 
                      onDelete={(u) => { 
                        setUserToDelete(u)
                        setShowDeleteModal(true) 
                      }} 
                      onUpdateStatus={handleUpdateStatus} 
                      canEdit={canEditUser} 
                      canDelete={canDeleteUser} 
                      isAdmin={isAdmin}
                      
                      // Novas funcionalidades
                      onRefresh={refetchUsers}
                      enableExport={true}
                      enableRefresh={true}
                      enableSelection={true}
                      showSummary={true}
                    />
                  </div>
              </>
            )}
            <Modal isOpen={showModal} onClose={() => !isMutating && setShowModal(false)} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}>
              <UserForm editingUser={editingUser} formData={formData} setFormData={setFormData} onSubmit={handleSubmit} onCancel={() => setShowModal(false)} isSubmitting={createMutation.isPending || updateMutation.isPending} canChangeRole={canChangeRole} />
            </Modal>
            <UserDeleteModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} user={userToDelete} onConfirm={handleDelete} isSubmitting={deleteMutation.isPending} />
          </>
        )}

        {activeTab === 'unlock' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <StatCard label="Bloqueados" value={unlockStats.totalBlocked} color="red" icon={Lock} active={statusFilter === 'blocked'} onClick={() => setStatusFilter('blocked')} />
              <StatCard label="Inativos" value={unlockStats.totalInactive} color="yellow" icon={Shield} active={statusFilter === 'inactive'} onClick={() => setStatusFilter('inactive')} />
              <StatCard label="Ativos" value={unlockStats.totalActive} color="green" icon={CheckCircle} active={statusFilter === 'active'} onClick={() => setStatusFilter('active')} />
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                  <input type="text" placeholder="Buscar por nome ou email..." value={unlockSearchTerm} onChange={(e) => setUnlockSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg">
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
            <Modal isOpen={showUnlockAllModal} onClose={() => setShowUnlockAllModal(false)} title="Desbloquear Todos" size="sm">
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">Tem certeza que deseja desbloquear todos os {unlockStats.totalBlocked} usuários?</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowUnlockAllModal(false)} disabled={unlockAllMutation.isPending} className="flex-1 order-2 sm:order-1">Cancelar</Button>
                  <Button variant="success" onClick={handleUnlockAll} loading={unlockAllMutation.isPending} className="flex-1 order-1 sm:order-2">Confirmar</Button>
                </div>
              </div>
            </Modal>
          </>
        )}
      </div>
    </div>
  )
}

export default Users