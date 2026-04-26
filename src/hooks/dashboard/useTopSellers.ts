// src/hooks/dashboard/useTopSellers.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@contexts/AuthContext'
import { useRealtime } from '@/hooks/utils/useRealTime'
import { fetchTopSellers, SellerData } from '@services/dashboard/topSellersService'

interface UseTopSellersReturn {
  data: SellerData[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<unknown>
  totalTeamSales: number
}

export function useTopSellers(months: number = 1, limit: number = 5): UseTopSellersReturn {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const { data = [], isLoading, error, refetch } = useQuery<SellerData[]>({
    queryKey: ['top-sellers', months, limit],
    queryFn: () => fetchTopSellers({ startDate, limit }),
    enabled: !!profile && (profile.role === 'admin' || profile.role === 'gerente'),
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true
  })

  // REALTIME: Atualiza quando há novas vendas
  useRealtime({
    table: 'sales',
    event: 'INSERT',
    onChange: () => {
      queryClient.invalidateQueries({ queryKey: ['top-sellers'] })
    },
    enabled: !!profile
  })

  useRealtime({
    table: 'sales',
    event: 'UPDATE',
    onChange: () => {
      queryClient.invalidateQueries({ queryKey: ['top-sellers'] })
    },
    enabled: !!profile
  })

  const totalTeamSales = data.reduce((sum, seller) => sum + seller.total, 0)

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch,
    totalTeamSales
  }
}