import { useQuery } from '@tanstack/react-query'
import { fetchSellerCommissions } from '@services/commission/commissionService'

// Baseado em: public.commissions
interface Commission {
  id: string
  user_id: string
  sale_id: number | null
  amount: number
  percentage: number
  period: string
  status: 'pending' | 'paid' | 'cancelled'
  paid_at: string | null
  paid_by: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

interface UseCommissionsReturn {
  data: Commission[] | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export const useCommissions = (userId: string | null, period: string | null = null) => {
  return useQuery<Commission[]>({
    queryKey: ['commissions', userId, period],
    queryFn: () => fetchSellerCommissions(userId as string, period),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000
  })
}