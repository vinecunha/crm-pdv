// pages/Users.jsx - COM LOGS INTEGRADOS
import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Edit, Trash2, Plus, Mail, User, Shield, RefreshCw, AlertTriangle, X } from 'lucide-react'

// Componentes genéricos
import DataTable from '../components/ui/DataTable'
import DataCards from '../components/ui/DataCards'
import DataFilters from '../components/ui/DataFilters'
import DataEmptyState from '../components/ui/DataEmptyState'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import UserForm from '../components/forms/UserForm'
import SplashScreen from '../components/ui/SplashScreen'
import useFeedback from '../hooks/useFeedback'
import useSystemLogs from '../hooks/useSystemLogs' // Importar logs

// Badge component
const UserRoleBadge = ({ role, size = 'sm' }) => {
  const config = {
    admin: { label: 'Administrador', styles: 'bg-purple-100 text-purple-800', icon: '👑' },
    gerente: { label: 'Gerente', styles: 'bg-blue-100 text-blue-800', icon: '⭐' },
    operador: { label: 'Operador', styles: 'bg-gray-100 text-gray-800', icon: '👤' }
  }
  const { label, styles, icon } = config[role] || config.operador
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-sm' }
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${styles} ${sizes[size]}`}>
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  )
}

const Users = () => {
  const { profile, loading: authLoading } = useAuth()
  const { feedback, showSuccess, showError, clearFeedback } = useFeedback()
  const { logCreate, logUpdate, logDelete, logError, logAction } = useSystemLogs() // Usar logs
  
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [userToDelete, setUserToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isAdmin = profile?.role === 'admin'
  const isManager = profile?.role === 'gerente'
  const canCreateUser = isAdmin
  const canEditUser = isAdmin || isManager
  const canDeleteUser = isAdmin
  const canChangeRole = isAdmin

  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'operador',
    password: ''
  })

  // Log de acesso à página
  useEffect(() => {
    logAction({
      action: 'VIEW',
      entityType: 'user',
      details: {
        component: 'Users',
        action: 'access_page',
        user_role: profile?.role
      }
    })
  }, [])

  // Definição das colunas da tabela
  const columns = [
    {
      key: 'full_name',
      header: 'Nome',
      sortable: true,
      render: (row) => (
        <div className="text-sm font-medium text-gray-900">
          {row.full_name || row.email?.split('@')[0]}
          {row.id === profile?.id && (
            <span className="ml-2 text-xs text-green-600">(Você)</span>
          )}
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (row) => <div className="text-sm text-gray-500">{row.email}</div>
    },
    {
      key: 'role',
      header: 'Papel',
      sortable: true,
      render: (row) => <UserRoleBadge role={row.role} size="sm" />
    },
    {
      key: 'created_at',
      header: 'Criado em',
      sortable: true,
      render: (row) => (
        <div className="text-sm text-gray-500">
          {new Date(row.created_at).toLocaleDateString('pt-BR')}
        </div>
      )
    }
  ]

  // Ações da tabela
  const actions = [
    {
      label: 'Editar',
      icon: <Edit size={18} />,
      onClick: (row) => handleEdit(row),
      disabled: (row) => !canEditUser || (!isAdmin && row.role === 'admin'),
      className: 'text-blue-600 hover:text-blue-900 hover:bg-blue-50'
    },
    {
      label: 'Excluir',
      icon: <Trash2 size={18} />,
      onClick: (row) => openDeleteModal(row),
      disabled: (row) => !canDeleteUser || row.id === profile?.id || (!isAdmin && row.role === 'admin'),
      className: 'text-red-600 hover:text-red-900 hover:bg-red-50'
    }
  ]

  // Definição dos filtros
  const filterConfigs = [
    {
      key: 'role',
      label: 'Papel',
      type: 'select',
      options: [
        { value: 'admin', label: 'Administrador' },
        { value: 'gerente', label: 'Gerente' },
        { value: 'operador', label: 'Operador' }
      ]
    }
  ]

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      setLoading(true)
      let query = supabase.from('profiles').select('*')
      
      if (filters.role) {
        query = query.eq('role', filters.role)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      setUsers(data || [])
      
      // Log de busca
      await logAction({
        action: 'SEARCH',
        entityType: 'user',
        details: {
          filters,
          result_count: data?.length || 0
        }
      })
      
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      await logError('user', error, { action: 'fetch_users', filters })
      showError('Erro ao carregar usuários. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (canCreateUser || canEditUser) {
      fetchUsers()
    } else {
      setLoading(false)
    }
  }, [filters])

  // Filtrar por busca
  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Abrir modal de confirmação de exclusão
  const openDeleteModal = (user) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
    
    // Log de abertura do modal de exclusão
    logAction({
      action: 'VIEW',
      entityType: 'user',
      entityId: user.id,
      details: {
        component: 'Users',
        action: 'open_delete_modal',
        user_email: user.email
      }
    })
  }

  // Confirmar exclusão
  const confirmDelete = async () => {
    if (!userToDelete) return
    
    setIsSubmitting(true)
    setShowDeleteModal(false)
    
    // Salvar dados do usuário para o log antes de deletar
    const userData = { ...userToDelete }
    
    try {
      // Chamar a função do Supabase
      const { data, error } = await supabase.rpc('delete_user_completely', {
        user_id: userToDelete.id
      })
      
      if (error) throw error
      
      if (data && !data.success) {
        throw new Error(data.error || 'Erro ao deletar usuário')
      }
      
      // LOG DE EXCLUSÃO
      await logDelete('user', userToDelete.id, userData, {
        deleted_by: profile?.email,
        deleted_by_role: profile?.role,
        user_email: userToDelete.email,
        user_role: userToDelete.role
      })
      
      showSuccess(`✅ Usuário ${userToDelete.full_name || userToDelete.email} excluído com sucesso!`)
      await fetchUsers()
      
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      await logError('user', error, { 
        action: 'delete_user',
        user_id: userToDelete.id,
        user_email: userToDelete.email
      })
      showError('Erro ao deletar usuário: ' + error.message)
    } finally {
      setIsSubmitting(false)
      setUserToDelete(null)
    }
  }

  // Handle Submit - COM LOGS
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      if (editingUser) {
        // ========== EDITAR USUÁRIO ==========
        console.log('Editando usuário:', editingUser)
        
        // Salvar dados antigos para o log
        const oldUserData = { ...editingUser }
        
        const updateData = {
          full_name: formData.full_name,
          updated_at: new Date().toISOString()
        }
        
        if (canChangeRole) {
          updateData.role = formData.role
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', editingUser.id)
        
        if (updateError) throw updateError
        
        // LOG DE ATUALIZAÇÃO
        const newUserData = {
          ...oldUserData,
          ...updateData
        }
        
        await logUpdate('user', editingUser.id, oldUserData, newUserData, {
          updated_by: profile?.email,
          updated_by_role: profile?.role,
          changes: {
            full_name: oldUserData.full_name !== formData.full_name,
            role: oldUserData.role !== formData.role
          }
        })
        
        showSuccess('✅ Usuário atualizado com sucesso!')
        
      } else {
        // ========== CRIAR NOVO USUÁRIO ==========
        console.log('Criando novo usuário:', formData)
        
        // Validações
        if (!formData.email || !formData.password || !formData.full_name) {
          throw new Error('Preencha todos os campos obrigatórios')
        }
        
        if (formData.password.length < 6) {
          throw new Error('A senha deve ter no mínimo 6 caracteres')
        }

        // Verificar se email já existe
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('email')
          .eq('email', formData.email)
          .maybeSingle()

        if (existingUser) {
          throw new Error('Este email já está cadastrado no sistema')
        }

        // Criar usuário no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: canChangeRole ? formData.role : 'operador'
            }
          }
        })
        
        if (authError) {
          console.error('Erro no signUp:', authError)
          throw new Error(`Erro ao criar autenticação: ${authError.message}`)
        }
        
        if (!authData.user) {
          throw new Error('Erro ao criar usuário: resposta inválida do servidor')
        }

        console.log('Auth user criado:', authData.user.id)

        // Aguardar o trigger criar o perfil
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Verificar se o perfil foi criado
        let profileData = null
        const { data: profileCheck } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle()

        if (!profileCheck) {
          console.warn('Perfil não foi criado pelo trigger, criando manualmente...')
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: formData.email,
              full_name: formData.full_name,
              role: canChangeRole ? formData.role : 'operador',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (insertError) {
            console.error('Erro ao criar perfil manualmente:', insertError)
            throw new Error('Usuário criado mas houve erro ao criar perfil')
          }
          profileData = insertedProfile
          console.log('Perfil criado manualmente com sucesso!')
        } else {
          profileData = profileCheck
        }
        
        // LOG DE CRIAÇÃO
        await logCreate('user', authData.user.id, {
          email: formData.email,
          full_name: formData.full_name,
          role: canChangeRole ? formData.role : 'operador',
          created_by: profile?.email,
          created_by_role: profile?.role
        }, {
          method: profileCheck ? 'auto_trigger' : 'manual_insert',
          auth_user_id: authData.user.id
        })
        
        showSuccess(`✅ Usuário ${formData.full_name} criado com sucesso!`)
      }
      
      // Limpar e recarregar
      setShowModal(false)
      resetForm()
      await fetchUsers()
      
    } catch (error) {
      console.error('Erro detalhado ao salvar:', error)
      await logError('user', error, { 
        action: editingUser ? 'update_user' : 'create_user',
        form_data: { ...formData, password: '[REDACTED]' }
      })
      showError(error.message || 'Erro ao salvar usuário. Verifique os dados e tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (userToEdit) => {
    setEditingUser(userToEdit)
    setFormData({
      email: userToEdit.email,
      full_name: userToEdit.full_name || '',
      role: userToEdit.role || 'operador',
      password: ''
    })
    setShowModal(true)
    
    // Log de abertura do modal de edição
    logAction({
      action: 'VIEW',
      entityType: 'user',
      entityId: userToEdit.id,
      details: {
        component: 'Users',
        action: 'open_edit_modal',
        user_email: userToEdit.email,
        user_role: userToEdit.role
      }
    })
  }

  const resetForm = () => {
    setEditingUser(null)
    setFormData({ email: '', full_name: '', role: 'operador', password: '' })
  }

  // Renderização do card
  const renderUserCard = (user) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <UserRoleBadge role={user.role} size="sm" />
            {user.id === profile?.id && (
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                Você
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-900 mt-2">
            {user.full_name || user.email?.split('@')[0]}
          </h3>
        </div>
      </div>
      
      <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700 break-all">{user.email}</span>
        </div>
        {user.full_name && (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-700">{user.full_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-gray-400" />
          <span className="text-gray-700 capitalize">{user.role}</span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
        {canEditUser && (!isAdmin ? user.role !== 'admin' : true) && (
          <button
            onClick={() => handleEdit(user)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm"
          >
            <Edit size={16} /> Editar
          </button>
        )}
        {canDeleteUser && user.id !== profile?.id && (!isAdmin ? user.role !== 'admin' : true) && (
          <button
            onClick={() => openDeleteModal(user)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm"
          >
            <Trash2 size={16} /> Excluir
          </button>
        )}
      </div>
    </div>
  )

  if (authLoading) {
    return <SplashScreen fullScreen message="Carregando usuários..." />
  }

  if (!canCreateUser && !canEditUser) {
    return (
      <DataEmptyState
        title="Acesso Restrito"
        description="Você não tem permissão para acessar esta página."
        icon="users"
      />
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gerencie os usuários do sistema
            {!loading && users.length > 0 && (
              <span className="ml-2 text-blue-600">({users.length} usuários)</span>
            )}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={fetchUsers} 
            icon={RefreshCw}
            disabled={loading}
          >
            Atualizar
          </Button>
          
          {canCreateUser && (
            <Button onClick={() => {
              resetForm()
              setShowModal(true)
              logAction({
                action: 'VIEW',
                entityType: 'user',
                details: {
                  component: 'Users',
                  action: 'open_create_modal'
                }
              })
            }} icon={Plus}>
              Novo Usuário
            </Button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback.message && (
        <FeedbackMessage
          type={feedback.type}
          message={feedback.message}
          onClose={clearFeedback}
        />
      )}

      {/* Filtros e Busca */}
      <DataFilters
        searchPlaceholder="Buscar usuários por nome ou email..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filterConfigs}
        onFilterChange={setFilters}
        className="mb-6"
      />

      {/* Loading */}
      {loading && <DataLoadingSkeleton type="table" rows={5} columns={4} />}

      {/* Empty State */}
      {!loading && filteredUsers.length === 0 && (
        <DataEmptyState
          title="Nenhum usuário encontrado"
          description={searchTerm || Object.keys(filters).length > 0 
            ? "Tente ajustar os filtros ou termos de busca"
            : "Clique em 'Novo Usuário' para adicionar o primeiro usuário"
          }
          icon="users"
          action={canCreateUser && !searchTerm && Object.keys(filters).length === 0 ? {
            label: "Criar primeiro usuário",
            icon: <Plus size={18} />,
            onClick: () => {
              resetForm()
              setShowModal(true)
            }
          } : null}
        />
      )}

      {/* Cards (Mobile) */}
      {!loading && filteredUsers.length > 0 && (
        <>
          <div className="block lg:hidden">
            <DataCards
              data={filteredUsers}
              renderCard={renderUserCard}
              keyExtractor={(user) => user.id}
              columns={1}
              gap={3}
            />
          </div>

          {/* Table (Desktop) */}
          <div className="hidden lg:block">
            <DataTable
              columns={columns}
              data={filteredUsers}
              actions={actions}
              emptyMessage="Nenhum usuário encontrado"
            />
          </div>
        </>
      )}

      {/* Modal de Usuário (Criar/Editar) */}
      <Modal
        isOpen={showModal}
        onClose={() => !isSubmitting && setShowModal(false)}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        isLoading={isSubmitting}
      >
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

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !isSubmitting && setShowDeleteModal(false)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tem certeza?
          </h3>
          
          <p className="text-sm text-gray-500 mb-4">
            Você está prestes a excluir o usuário:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="font-medium text-gray-900">
              {userToDelete?.full_name || userToDelete?.email?.split('@')[0]}
            </p>
            <p className="text-xs text-gray-500 break-all">
              {userToDelete?.email}
            </p>
            <span className="inline-block mt-1">
              <UserRoleBadge role={userToDelete?.role} size="sm" />
            </span>
          </div>
          
          <p className="text-xs text-red-600 mb-6">
            ⚠️ Esta ação não pode ser desfeita. O usuário será permanentemente removido do sistema.
          </p>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Sim, excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Users