import { useCallback, useMemo, FormEvent } from 'react'

// Baseado em: public.profiles
interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  status: string
  registration_number: string | null
  [key: string]: unknown
}

// Baseado em: public.profiles (status)
type UserStatus = 'active' | 'inactive' | 'blocked' | 'locked'

interface Profile {
  id: string
  [key: string]: unknown
}

interface UserFormData {
  email: string
  full_name: string
  role: string
  password: string
  registration_number: string
}

interface Filters {
  [key: string]: string
}

interface StatusBadge {
  label: string
  variant: 'success' | 'warning' | 'danger' | 'info'
}

interface UnlockStats {
  totalActive: number
  totalInactive: number
  totalBlocked: number
}

interface LogActionParams {
  action: string
  entityType: string
  entityId: string
  details?: Record<string, unknown>
}

interface MutationResult<T> {
  mutate: (data: T, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
  isPending: boolean
}

interface UseUsersHandlersProps {
  profile: Profile | null
  isAdmin: boolean
  isManager: boolean
  canCreateUser: boolean
  canEditUser: boolean
  canDeleteUser: boolean
  canChangeRole: boolean
  editingUser: User | null
  setEditingUser: (user: User | null) => void
  userToDelete: User | null
  setUserToDelete: (user: User | null) => void
  formData: UserFormData
  setFormData: (data: UserFormData) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  filters: Filters
  setFilters: (filters: Filters) => void
  unlockSearchTerm: string
  setUnlockSearchTerm: (term: string) => void
  statusFilter: string
  setStatusFilter: (status: string) => void
  showModal: boolean
  setShowModal: (show: boolean) => void
  showDeleteModal: boolean
  setShowDeleteModal: (show: boolean) => void
  showUnlockAllModal: boolean
  setShowUnlockAllModal: (show: boolean) => void
  blockedUsers: User[]
  createMutation: MutationResult<{
    email: string
    password: string
    full_name: string
    role: string
    registration_number: string
  }>
  updateMutation: MutationResult<{
    id: string
    data: { full_name: string; role?: string }
  }>
  updateStatusMutation: MutationResult<{
    id: string
    status: string
    oldStatus: string
  }>
  deleteMutation: MutationResult<string>
  unlockMutation: MutationResult<string>
  unlockAllMutation: MutationResult<string[]>
  refetchUsers: () => void
  refetchBlocked: () => void
  showFeedback: (type: 'success' | 'error' | 'info', message: string) => void
  logAction: (params: LogActionParams) => Promise<boolean>
}

interface UseUsersHandlersReturn {
  resetForm: () => void
  handleEdit: (user: User) => void
  handleCloseModal: () => void
  handleOpenCreateModal: () => void
  handleSubmit: (e: FormEvent) => void
  handleDeleteClick: (user: User) => void
  handleCloseDeleteModal: () => void
  handleDelete: () => void
  handleUpdateStatus: (user: User, newStatus: UserStatus) => void
  handleUnlockUser: (user: User) => void
  handleUnlockAll: () => void
  handleCloseUnlockAllModal: () => void
  handleRefresh: () => void
  unlockStats: UnlockStats
  getStatusBadge: (status: string) => StatusBadge
  setSearchTerm: (term: string) => void
  setFilters: (filters: Filters) => void
  setUnlockSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
}

export const useUsersHandlers = ({
  profile,
  isAdmin,
  isManager,
  canCreateUser,
  canEditUser,
  canDeleteUser,
  canChangeRole,
  editingUser,
  setEditingUser,
  userToDelete,
  setUserToDelete,
  formData,
  setFormData,
  searchTerm,
  setSearchTerm,
  filters,
  setFilters,
  unlockSearchTerm,
  setUnlockSearchTerm,
  statusFilter,
  setStatusFilter,
  showModal,
  setShowModal,
  showDeleteModal,
  setShowDeleteModal,
  showUnlockAllModal,
  setShowUnlockAllModal,
  blockedUsers,
  createMutation,
  updateMutation,
  updateStatusMutation,
  deleteMutation,
  unlockMutation,
  unlockAllMutation,
  refetchUsers,
  refetchBlocked,
  showFeedback,
  logAction
}: UseUsersHandlersProps): UseUsersHandlersReturn => {

  const resetForm = useCallback(() => {
    setEditingUser(null)
    setFormData({ 
      email: '', 
      full_name: '', 
      role: 'operador', 
      password: '',
      registration_number: '' 
    })
  }, [setEditingUser, setFormData])

  const handleEdit = useCallback((user: User) => {
    setEditingUser(user)
    setFormData({ 
      email: user.email, 
      full_name: user.full_name || '', 
      role: user.role || 'operador', 
      password: '',
      registration_number: user.registration_number || ''
    })
    setShowModal(true)
  }, [setEditingUser, setFormData, setShowModal])

  const handleCloseModal = useCallback(() => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      setShowModal(false)
      resetForm()
    }
  }, [createMutation.isPending, updateMutation.isPending, setShowModal, resetForm])

  const handleOpenCreateModal = useCallback(() => {
    resetForm()
    setShowModal(true)
  }, [resetForm, setShowModal])

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault()
    
    if (editingUser) {
      const updateData: { full_name: string; role?: string } = { 
        full_name: formData.full_name 
      }
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
  }, [editingUser, formData, canChangeRole, createMutation, updateMutation, showFeedback])

  const handleDeleteClick = useCallback((user: User) => {
    setUserToDelete(user)
    setShowDeleteModal(true)
  }, [setUserToDelete, setShowDeleteModal])

  const handleCloseDeleteModal = useCallback(() => {
    setShowDeleteModal(false)
    setUserToDelete(null)
  }, [setShowDeleteModal, setUserToDelete])

  const handleDelete = useCallback(() => {
    if (!userToDelete) return
    deleteMutation.mutate(userToDelete.id)
  }, [userToDelete, deleteMutation])

  const handleUpdateStatus = useCallback((user: User, newStatus: UserStatus) => {
    updateStatusMutation.mutate({ 
      id: user.id, 
      status: newStatus, 
      oldStatus: user.status || 'active' 
    })
  }, [updateStatusMutation])

  const handleUnlockUser = useCallback((user: User) => {
    unlockMutation.mutate(user.id)
  }, [unlockMutation])

  const handleUnlockAll = useCallback(() => {
    const blockedIds = blockedUsers
      .filter(u => u.status === 'blocked' || u.status === 'locked')
      .map(u => u.id)
    unlockAllMutation.mutate(blockedIds)
  }, [blockedUsers, unlockAllMutation])

  const handleCloseUnlockAllModal = useCallback(() => {
    setShowUnlockAllModal(false)
  }, [setShowUnlockAllModal])

  const handleRefresh = useCallback(() => {
    refetchUsers()
    refetchBlocked()
  }, [refetchUsers, refetchBlocked])

  const unlockStats = useMemo((): UnlockStats => ({
    totalActive: blockedUsers.filter(u => u.status === 'active').length,
    totalInactive: blockedUsers.filter(u => u.status === 'inactive').length,
    totalBlocked: blockedUsers.filter(u => u.status === 'blocked' || u.status === 'locked').length
  }), [blockedUsers])

  const getStatusBadge = useCallback((status: string): StatusBadge => {
    const configs: Record<string, StatusBadge> = { 
      active: { label: 'Ativo', variant: 'success' }, 
      inactive: { label: 'Inativo', variant: 'warning' }, 
      blocked: { label: 'Bloqueado', variant: 'danger' }, 
      locked: { label: 'Bloqueado', variant: 'danger' } 
    }
    return configs[status] || configs.active
  }, [])

  return {
    resetForm,
    handleEdit,
    handleCloseModal,
    handleOpenCreateModal,
    handleSubmit,
    handleDeleteClick,
    handleCloseDeleteModal,
    handleDelete,
    handleUpdateStatus,
    handleUnlockUser,
    handleUnlockAll,
    handleCloseUnlockAllModal,
    handleRefresh,
    unlockStats,
    getStatusBadge,
    setSearchTerm,
    setFilters,
    setUnlockSearchTerm,
    setStatusFilter
  }
}