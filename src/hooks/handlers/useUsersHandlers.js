// src/hooks/handlers/useUsersHandlers.js
import { useCallback, useMemo } from 'react'

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
}) => {

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

  const handleEdit = useCallback((user) => {
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

  const handleSubmit = useCallback((e) => {
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
  }, [editingUser, formData, canChangeRole, createMutation, updateMutation, showFeedback])

  const handleDeleteClick = useCallback((user) => {
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

  const handleUpdateStatus = useCallback((user, newStatus) => {
    updateStatusMutation.mutate({ 
      id: user.id, 
      status: newStatus, 
      oldStatus: user.status || 'active' 
    })
  }, [updateStatusMutation])

  const handleUnlockUser = useCallback((user) => {
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

  const unlockStats = useMemo(() => ({
    totalActive: blockedUsers.filter(u => u.status === 'active').length,
    totalInactive: blockedUsers.filter(u => u.status === 'inactive').length,
    totalBlocked: blockedUsers.filter(u => u.status === 'blocked' || u.status === 'locked').length
  }), [blockedUsers])

  const getStatusBadge = useCallback((status) => {
    const configs = { 
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