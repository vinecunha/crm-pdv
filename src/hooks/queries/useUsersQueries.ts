import { useQuery } from '@tanstack/react-query'
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

interface Filters {
  [key: string]: string | boolean | null
}

interface UseUsersQueriesProps {
  filters: Filters
  activeTab: string
  isAdmin: boolean
}

interface UseUsersQueriesReturn {
  users: User[]
  loadingUsers: boolean
  refetchUsers: () => Promise<unknown>
  blockedUsers: User[]
  loadingBlocked: boolean
  refetchBlocked: () => Promise<unknown>
}

export const useUsersQueries = ({
  filters,
  activeTab,
  isAdmin
}: UseUsersQueriesProps): UseUsersQueriesReturn => {
  
  const { 
    data: users = [], 
    isLoading: loadingUsers, 
    refetch: refetchUsers 
  } = useQuery<User[]>({
    queryKey: ['users', { filters }],
    queryFn: () => userService.fetchUsers(filters),
    enabled: activeTab === 'users',
  })

  const { 
    data: blockedUsers = [], 
    isLoading: loadingBlocked, 
    refetch: refetchBlocked 
  } = useQuery<User[]>({
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