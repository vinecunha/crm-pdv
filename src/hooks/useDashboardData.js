import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { fetchDashboardDataByRole } from '../services/dashboardService'

export const useDashboardData = () => {
  const { profile } = useAuth()
  
  return useQuery({
    queryKey: ['dashboard', profile?.id, profile?.role],
    queryFn: () => fetchDashboardDataByRole(profile?.id, profile?.role),
    enabled: !!profile,
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true
  })
}