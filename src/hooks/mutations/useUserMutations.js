// src/hooks/mutations/useUserMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as userService from '@services/user/userService'

export const useUserMutations = (callbacks = {}) => {
  const queryClient = useQueryClient()
  const { logCreate, logUpdate, logDelete, logAction } = useSystemLogs()

  const {
    onUserCreated,
    onUserUpdated,
    onUserStatusUpdated,
    onUserDeleted,
    onUserUnlocked,
    onAllUsersUnlocked,
    onError
  } = callbacks

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: async (user) => {
      await logCreate('user', user.id, { email: user.email })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onUserCreated?.(user)
    },
    onError: (error) => onError?.(error)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userService.updateUser(id, data),
    onSuccess: async (data) => {
      await logUpdate('user', data.id, null, data)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onUserUpdated?.(data)
    },
    onError: (error) => onError?.(error)
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => userService.updateUserStatus(id, status),
    onSuccess: async (data, variables) => {
      await logAction({ 
        action: 'UPDATE_USER_STATUS', 
        entityType: 'profile', 
        entityId: data.id, 
        details: { old_status: variables.oldStatus, new_status: data.status } 
      })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      onUserStatusUpdated?.(data)
    },
    onError: (error) => onError?.(error)
  })

  const deleteMutation = useMutation({
    mutationFn: userService.deleteUser,
    onSuccess: async (id) => {
      await logDelete('user', id)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      onUserDeleted?.(id)
    },
    onError: (error) => onError?.(error)
  })

  const unlockMutation = useMutation({
    mutationFn: (id) => userService.updateUserStatus(id, 'active'),
    onSuccess: async (data) => {
      await logAction({ action: 'UNLOCK_USER', entityType: 'profile', entityId: data.id })
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      onUserUnlocked?.(data)
    },
    onError: (error) => onError?.(error)
  })

  const unlockAllMutation = useMutation({
    mutationFn: userService.unlockAllUsers,
    onSuccess: async (count) => {
      await logAction({ action: 'UNLOCK_ALL_USERS', entityType: 'profile', details: { count } })
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      onAllUsersUnlocked?.(count)
    },
    onError: (error) => onError?.(error)
  })

  const isMutating = createMutation.isPending || updateMutation.isPending || 
                     deleteMutation.isPending || updateStatusMutation.isPending

  return {
    createMutation,
    updateMutation,
    updateStatusMutation,
    deleteMutation,
    unlockMutation,
    unlockAllMutation,
    isMutating
  }
}
