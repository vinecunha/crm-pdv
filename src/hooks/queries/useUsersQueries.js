// src/hooks/queries/useUsersQueries.js
import { useQuery } from '@tanstack/react-query'
import * as userService from '@services/user/userService'

export const useUsersQueries = ({ filters, activeTab, isAdmin }) => {
  // Query de usuários
  const { 
    data: users = [], 
    isLoading: loadingUsers, 
    refetch: refetchUsers 
  } = useQuery({
    queryKey: ['users', { filters }],
    queryFn: () => userService.fetchUsers(filters),
    enabled: activeTab === 'users',
  })

  // Query de usuários bloqueados
  const { 
    data: blockedUsers = [], 
    isLoading: loadingBlocked, 
    refetch: refetchBlocked 
  } = useQuery({
    queryKey: ['blocked-users'],
    queryFn: userService.fetchBlockedUsers,
    enabled: activeTab === 'unlock' && isAdmin,
  })

  return {
    users,
    loadingUsers,
    refetchUsers,
    blockedUsers,
    loadingBlocked,
    refetchBlocked
  }
}
