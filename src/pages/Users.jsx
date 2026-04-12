import React, { useState, useEffect } from 'react'
import { Plus, RefreshCw, Users as UsersIcon, Unlock, Search, CheckCircle, Lock, Shield, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import DataEmptyState from '../components/ui/DataEmptyState'
import DataCards from '../components/ui/DataCards'
import DataTable from '../components/ui/DataTable'
import Badge from '../components/Badge'
import useSystemLogs from '../hooks/useSystemLogs'
import { formatDateTime } from '../utils/formatters'

import UserStats from '../components/users/UserStats'
import UserForm from '../components/users/UserForm'
import UserTable from '../components/users/UserTable'
import UserFilters from '../components/users/UserFilters'
import UserDeleteModal from '../components/users/UserDeleteModal'
import UserRoleBadge from '../components/users/UserRoleBadge'

const Users = () => {
  const { profile } = useAuth()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs()
  
  // Estados da aba Usuários
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [formData, setFormData] = useState({ email: '', full_name: '', role: 'operador', password: '' })

  // Estados da aba Desbloqueio
  const [activeTab, setActiveTab] = useState('users')
  const [blockedUsers, setBlockedUsers] = useState([])
  const [filteredBlockedUsers, setFilteredBlockedUsers] = useState([])
  const [unlockSearchTerm, setUnlockSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('blocked')
  const [loadingUnlock, setLoadingUnlock] = useState(false)
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [showUnlockAllModal, setShowUnlockAllModal] = useState(false)
  const [unlockStats, setUnlockStats] = useState({ totalActive: 0, totalInactive: 0, totalBlocked: 0 })

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'gerente'
  const canCreateUser = isAdmin
  const canEditUser = isAdmin || isManager
  const canDeleteUser = isAdmin
  const canChangeRole = isAdmin

  useEffect(() => {
    logAction({ action: 'VIEW', entityType: 'user', details: { user_role: profile?.role } })
    fetchUsers()
    
    if (isAdmin) {
      fetchBlockedUsers()
    }
  }, [filters])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  // ========== FUNÇÕES DA ABA USUÁRIOS ==========
  const fetchUsers = async () => {
    setLoading(true)
    try {
      let query = supabase.from('profiles').select('*')
      if (filters.role) query = query.eq('role', filters.role)
      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      showFeedback('error', 'Erro ao carregar usuários')
      await logError('user', error, { action: 'fetch_users' })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({ email: user.email, full_name: user.full_name || '', role: user.role || 'operador', password: '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (editingUser) {
        const updateData = { full_name: formData.full_name }
        if (canChangeRole) updateData.role = formData.role
        
        const { error } = await supabase.from('profiles').update(updateData).eq('id', editingUser.id)
        if (error) throw error
        
        await logUpdate('user', editingUser.id, editingUser, { ...editingUser, ...updateData })
        showFeedback('success', 'Usuário atualizado!')
      } else {
        if (!formData.email || !formData.password || !formData.full_name) {
          throw new Error('Preencha todos os campos obrigatórios')
        }
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { full_name: formData.full_name, role: canChangeRole ? formData.role : 'operador' } }
        })
        
        if (authError) throw authError
        
        await logCreate('user', authData.user.id, { email: formData.email, full_name: formData.full_name, role: formData.role })
        showFeedback('success', 'Usuário criado!')
      }
      
      setShowModal(false)
      resetForm()
      await fetchUsers()
    } catch (error) {
      showFeedback('error', error.message || 'Erro ao salvar usuário')
      await logError('user', error, { action: editingUser ? 'update' : 'create' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) return
    setIsSubmitting(true)
    
    try {
      const { data, error } = await supabase.rpc('delete_user_completely', { user_id: userToDelete.id })
      if (error) throw error
      if (data && !data.success) throw new Error(data.error)
      
      await logDelete('user', userToDelete.id, userToDelete)
      showFeedback('success', `Usuário ${userToDelete.full_name || userToDelete.email} excluído!`)
      setShowDeleteModal(false)
      setUserToDelete(null)
      await fetchUsers()
    } catch (error) {
      showFeedback('error', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({ email: '', full_name: '', role: 'operador', password: '' })
  }

  // ========== FUNÇÕES DA ABA DESBLOQUEIO ==========
  const fetchBlockedUsers = async () => {
    setLoadingUnlock(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const usersData = (data || []).map(u => ({
        ...u,
        status: u.status || 'active'
      }))
      
      setBlockedUsers(usersData)
      
      setUnlockStats({
        totalActive: usersData.filter(u => u.status === 'active').length,
        totalInactive: usersData.filter(u => u.status === 'inactive').length,
        totalBlocked: usersData.filter(u => u.status === 'blocked' || u.status === 'locked').length
      })
      
      filterBlockedUsers(usersData, unlockSearchTerm, statusFilter)
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      showFeedback('error', 'Erro ao carregar dados')
    } finally {
      setLoadingUnlock(false)
    }
  }

  const filterBlockedUsers = (usersList = blockedUsers, search = unlockSearchTerm, filter = statusFilter) => {
    let filtered = [...usersList]
    
    if (filter === 'blocked') {
      filtered = filtered.filter(u => u.status === 'blocked' || u.status === 'locked')
    } else if (filter === 'inactive') {
      filtered = filtered.filter(u => u.status === 'inactive')
    } else if (filter === 'active') {
      filtered = filtered.filter(u => u.status === 'active')
    }
    
    if (search.trim()) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(searchLower) ||
        u.full_name?.toLowerCase().includes(searchLower) ||
        u.display_name?.toLowerCase().includes(searchLower)
      )
    }
    
    setFilteredBlockedUsers(filtered)
  }

  const handleUnlockSearch = (value) => {
    setUnlockSearchTerm(value)
    filterBlockedUsers(blockedUsers, value, statusFilter)
  }

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value)
    filterBlockedUsers(blockedUsers, unlockSearchTerm, value)
  }

  const handleUnlockUser = async (user) => {
    setIsUnlocking(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      await logAction({
        action: 'UNLOCK_USER',
        entityType: 'profile',
        entityId: user.id,
        details: { user_email: user.email, unlocked_by: profile?.email }
      })

      showFeedback('success', `Usuário ${user.email} desbloqueado!`)
      fetchBlockedUsers()
    } catch (error) {
      showFeedback('error', 'Erro ao desbloquear usuário')
    } finally {
      setIsUnlocking(false)
    }
  }

  const handleUnlockAll = async () => {
    setIsUnlocking(true)
    try {
      const blocked = blockedUsers.filter(u => u.status === 'blocked' || u.status === 'locked')
      
      for (const user of blocked) {
        await supabase
          .from('profiles')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', user.id)
      }

      await logAction({
        action: 'UNLOCK_ALL_USERS',
        entityType: 'profile',
        details: { unlocked_by: profile?.email, count: blocked.length }
      })

      showFeedback('success', `${blocked.length} usuários desbloqueados!`)
      setShowUnlockAllModal(false)
      fetchBlockedUsers()
    } catch (error) {
      showFeedback('error', 'Erro ao desbloquear usuários')
    } finally {
      setIsUnlocking(false)
    }
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
    return (
      <Badge variant={config.variant}>
        <Icon size={12} className="mr-1" />
        {config.label}
      </Badge>
    )
  }

  const unlockColumns = [
    {
      key: 'email',
      header: 'Usuário',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
            row.status === 'active' ? 'bg-gradient-to-br from-green-500 to-green-600' :
            row.status === 'inactive' ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
            'bg-gradient-to-br from-red-500 to-red-600'
          }`}>
            {row.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {row.display_name || row.full_name || row.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Função',
      render: (row) => (
        <Badge variant={row.role === 'admin' ? 'purple' : row.role === 'gerente' ? 'info' : 'default'}>
          {row.role === 'admin' ? 'Admin' : row.role === 'gerente' ? 'Gerente' : 'Operador'}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => getStatusBadge(row.status)
    },
    {
      key: 'last_login',
      header: 'Último Acesso',
      render: (row) => (
        <span className="text-sm text-gray-600">
          {row.last_login ? formatDateTime(row.last_login) : 'Nunca'}
        </span>
      )
    }
  ]

  const unlockActions = [
    {
      label: 'Desbloquear',
      icon: <Unlock size={16} />,
      onClick: handleUnlockUser,
      className: 'text-green-600 hover:text-green-800 hover:bg-green-50',
      disabled: (row) => row.status === 'active' || row.id === profile?.id
    }
  ]

  const renderUserCard = (user) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <UserRoleBadge role={user.role} size="sm" />
        {user.id === profile?.id && (
          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">Você</span>
        )}
      </div>
      
      <h3 className="font-semibold text-gray-900 mb-2">{user.full_name || user.email?.split('@')[0]}</h3>
      <p className="text-sm text-gray-500 mb-3 break-all">{user.email}</p>
      
      <div className="flex gap-2 pt-3 border-t border-gray-100">
        {canEditUser && (!isAdmin ? user.role !== 'admin' : true) && (
          <button onClick={() => handleEdit(user)} className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm">
            Editar
          </button>
        )}
        {canDeleteUser && user.id !== profile?.id && (!isAdmin ? user.role !== 'admin' : true) && (
          <button onClick={() => { setUserToDelete(user); setShowDeleteModal(true) }} className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm">
            Excluir
          </button>
        )}
      </div>
    </div>
  )

  const tabs = [
    { id: 'users', label: 'Usuários', icon: UsersIcon },
    ...(isAdmin ? [{ id: 'unlock', label: 'Desbloqueio', icon: Unlock, badge: unlockStats.totalBlocked }] : [])
  ]

  if (!canCreateUser && !canEditUser) {
    return <DataEmptyState title="Acesso Restrito" description="Você não tem permissão para acessar esta página." icon="users" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedback.show && (
          <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ show: false })} />
        )}

        {/* Header com Tabs */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
              <p className="text-gray-500 mt-1">Gerencie os usuários e acessos do sistema</p>
            </div>
            
            {activeTab === 'users' && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={fetchUsers} loading={loading} icon={RefreshCw}>
                  Atualizar
                </Button>
                {canCreateUser && (
                  <Button onClick={() => { resetForm(); setShowModal(true) }} icon={Plus}>
                    Novo Usuário
                  </Button>
                )}
              </div>
            )}
            
            {activeTab === 'unlock' && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={fetchBlockedUsers} loading={loadingUnlock} icon={RefreshCw}>
                  Atualizar
                </Button>
                {unlockStats.totalBlocked > 0 && (
                  <Button variant="success" onClick={() => setShowUnlockAllModal(true)} icon={Unlock}>
                    Desbloquear Todos ({unlockStats.totalBlocked})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mt-4">
            <nav className="flex gap-6">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Conteúdo da Aba Usuários */}
        {activeTab === 'users' && (
          <>
            <UserStats users={users} />
            <UserFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} filters={filters} setFilters={setFilters} />

            {loading && <DataLoadingSkeleton />}

            {!loading && filteredUsers.length === 0 && (
              <DataEmptyState 
                title="Nenhum usuário encontrado" 
                description={searchTerm || filters.role ? "Tente ajustar os filtros" : "Clique em 'Novo Usuário' para adicionar"} 
                icon="users" 
              />
            )}

            {!loading && filteredUsers.length > 0 && (
              <>
                <div className="block lg:hidden">
                  <DataCards data={filteredUsers} renderCard={renderUserCard} keyExtractor={(u) => u.id} columns={1} gap={3} />
                </div>
                <div className="hidden lg:block">
                  <UserTable 
                    users={filteredUsers} 
                    currentUserId={profile?.id} 
                    onEdit={handleEdit} 
                    onDelete={(u) => { setUserToDelete(u); setShowDeleteModal(true) }} 
                    canEdit={canEditUser} 
                    canDelete={canDeleteUser} 
                    isAdmin={isAdmin} 
                  />
                </div>
              </>
            )}

            <Modal isOpen={showModal} onClose={() => !isSubmitting && setShowModal(false)} title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}>
              <UserForm 
                editingUser={editingUser} 
                formData={formData} 
                setFormData={setFormData} 
                onSubmit={handleSubmit} 
                onCancel={() => setShowModal(false)} 
                isSubmitting={isSubmitting} 
                canChangeRole={canChangeRole} 
              />
            </Modal>

            <UserDeleteModal 
              isOpen={showDeleteModal} 
              onClose={() => setShowDeleteModal(false)} 
              user={userToDelete} 
              onConfirm={handleDelete} 
              isSubmitting={isSubmitting} 
            />
          </>
        )}

        {/* Conteúdo da Aba Desbloqueio */}
        {activeTab === 'unlock' && (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <StatCard 
                label="Bloqueados" 
                value={unlockStats.totalBlocked} 
                color="red" 
                icon={Lock}
                active={statusFilter === 'blocked'}
                onClick={() => handleStatusFilterChange('blocked')}
              />
              <StatCard 
                label="Inativos" 
                value={unlockStats.totalInactive} 
                color="yellow" 
                icon={Shield}
                active={statusFilter === 'inactive'}
                onClick={() => handleStatusFilterChange('inactive')}
              />
              <StatCard 
                label="Ativos" 
                value={unlockStats.totalActive} 
                color="green" 
                icon={CheckCircle}
                active={statusFilter === 'active'}
                onClick={() => handleStatusFilterChange('active')}
              />
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou email..."
                    value={unlockSearchTerm}
                    onChange={(e) => handleUnlockSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="blocked">Bloqueados</option>
                  <option value="inactive">Inativos</option>
                  <option value="active">Ativos</option>
                  <option value="all">Todos</option>
                </select>
              </div>
            </div>

            {loadingUnlock && <DataLoadingSkeleton />}

            {!loadingUnlock && filteredBlockedUsers.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <CheckCircle size={48} className="text-green-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {statusFilter === 'blocked' ? 'Nenhum usuário bloqueado!' : 'Nenhum usuário encontrado'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {statusFilter === 'blocked' ? 'Todos os usuários podem acessar o sistema' : 'Tente ajustar os filtros'}
                </p>
              </div>
            ) : (
              !loadingUnlock && (
                <DataTable
                  columns={unlockColumns}
                  data={filteredBlockedUsers}
                  actions={unlockActions}
                  striped
                  hover
                  pagination
                  itemsPerPageOptions={[20, 50, 100]}
                  defaultItemsPerPage={20}
                  showTotalItems
                />
              )
            )}

            {/* Modal de Confirmação */}
            <Modal
              isOpen={showUnlockAllModal}
              onClose={() => setShowUnlockAllModal(false)}
              title="Desbloquear Todos"
              size="sm"
            >
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={18} className="text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">
                      Tem certeza que deseja desbloquear todos os {unlockStats.totalBlocked} usuários?
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowUnlockAllModal(false)} disabled={isUnlocking} className="flex-1">
                    Cancelar
                  </Button>
                  <Button variant="success" onClick={handleUnlockAll} loading={isUnlocking} className="flex-1">
                    Confirmar
                  </Button>
                </div>
              </div>
            </Modal>
          </>
        )}
      </div>
    </div>
  )
}

// Componente StatCard
const StatCard = ({ label, value, color, icon: Icon, active, onClick }) => {
  const colors = {
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-500' },
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-500' }
  }
  
  return (
    <div 
      className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all hover:shadow-md ${
        active ? colors[color].border : 'border-gray-200'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${colors[color].text}`}>{value}</p>
        </div>
        <div className={`p-3 ${colors[color].bg} rounded-full`}>
          <Icon size={24} className={colors[color].text} />
        </div>
      </div>
    </div>
  )
}

export default Users