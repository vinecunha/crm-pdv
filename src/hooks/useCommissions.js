import { useQuery } from '@tanstack/react-query'
import { fetchSellerCommissions } from '../services/commissionService'

export const useCommissions = (userId, period = null) => {
  return useQuery({
    queryKey: ['commissions', userId, period],
    queryFn: () => fetchSellerCommissions(userId, period),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  })
}