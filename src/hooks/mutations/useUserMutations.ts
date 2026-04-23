import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as userService from '@services/user/userService'

// Baseado em: public.profiles
interface User {
  id: string
  email: string
  role: string
  full_name: string | null
  avatar_url: string | null
  created_at: string | null
  updated_at: string | null
  phone: string | null
  document: string | null
  birth_date: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  language: string | null
  timezone: string | null
  notifications_enabled: boolean | null
  dark_mode: boolean | null
  last_login: string | null
  login_count: number | null
  metadata: Record<string, unknown> | null
  display_name: string | null
  status: string | null
  registration_number: string | null
  sidebar_collapsed: boolean | null
  table_density: string | null
  theme_mode: string | null
}

interface UserFormData {
  email: string
  password: string
  full_name: string
  role: string
  registration_number?: string
}

interface UserUpdateData {
  full_name?: string
  role?: string
  [key: string]: unknown
}

interface StatusUpdateVariables {
  id: string
  status: string
  oldStatus: string
}

interface UserCallbacks {
  onUserCreated?: (user: User) => void
  onUserUpdated?: (user: User) => void
  onUserStatusUpdated?: (user: User) => void
  onUserDeleted?: (id: string) => void
  onUserUnlocked?: (user: User) => void
  onAllUsersUnlocked?: (count: number) => void
  onError?: (error: Error) => void
}

interface UseUserMutationsReturn {
  createMutation: ReturnType<typeof useMutation>
  updateMutation: ReturnType<typeof useMutation>
  updateStatusMutation: ReturnType<typeof useMutation>
  deleteMutation: ReturnType<typeof useMutation>
  unlockMutation: ReturnType<typeof useMutation>
  unlockAllMutation: ReturnType<typeof useMutation>
  isMutating: boolean
}

export const useUserMutations = (callbacks: UserCallbacks = {}): UseUserMutationsReturn => {
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
    mutationFn: (data: UserFormData) => userService.createUser(data),
    onSuccess: async (user: User) => {
      await logCreate('user', user.id, { email: user.email })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onUserCreated?.(user)
    },
    onError: (error: Error) => onError?.(error)
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UserUpdateData }) => 
      userService.updateUser(id, data),
    onSuccess: async (data: User) => {
      await logUpdate('user', data.id, null, data)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onUserUpdated?.(data)
    },
    onError: (error: Error) => onError?.(error)
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      userService.updateUserStatus(id, status),
    onSuccess: async (data: User, variables: StatusUpdateVariables) => {
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
    onError: (error: Error) => onError?.(error)
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: async (id: string) => {
      await logDelete('user', id, {})
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      onUserDeleted?.(id)
    },
    onError: (error: Error) => onError?.(error)
  })

  const unlockMutation = useMutation({
    mutationFn: (id: string) => userService.updateUserStatus(id, 'active'),
    onSuccess: async (data: User) => {
      await logAction({ action: 'UNLOCK_USER', entityType: 'profile', entityId: data.id })
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      onUserUnlocked?.(data)
    },
    onError: (error: Error) => onError?.(error)
  })

  const unlockAllMutation = useMutation({
    mutationFn: (ids: string[]) => userService.unlockAllUsers(ids),
    onSuccess: async (count: number) => {
      await logAction({ action: 'UNLOCK_ALL_USERS', entityType: 'profile', details: { count } })
      queryClient.invalidateQueries({ queryKey: ['blocked-users'] })
      onAllUsersUnlocked?.(count)
    },
    onError: (error: Error) => onError?.(error)
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