// src/hooks/dashboard/useRevenueCost.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@contexts/AuthContext'
import { useRealtime } from '@/hooks/utils/useRealTime'
import { fetchRevenueCostData, RevenueCostData } from '@services/dashboard/revenueCostService'

interface UseRevenueCostReturn {
  data: RevenueCostData[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export function useRevenueCost(period: '6months' | '12months' | 'thisYear' = '6months'): UseRevenueCostReturn {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const { data = [], isLoading, error, refetch } = useQuery<RevenueCostData[]>({
    queryKey: ['revenue-cost', profile?.id, profile?.role, period],
    queryFn: () => fetchRevenueCostData({ 
      period, 
      userId: profile?.id, 
      role: profile?.role 
    }),
    enabled: !!profile,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true
  })

  // =============================================
  // REALTIME: Usando o hook existente
  // =============================================
  
  // Quando uma nova venda é inserida
  useRealtime({
    table: 'sales',
    event: 'INSERT',
    onChange: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-cost'] })
    },
    enabled: !!profile
  })

  // Quando uma venda é atualizada (cancelada, etc)
  useRealtime({
    table: 'sales',
    event: 'UPDATE',
    onChange: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-cost'] })
    },
    enabled: !!profile
  })

  // Quando uma comissão é paga
  useRealtime({
    table: 'commissions',
    event: 'UPDATE',
    onChange: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-cost'] })
    },
    enabled: !!profile
  })

  // Quando entra um novo produto no estoque
  useRealtime({
    table: 'product_entries',
    event: 'INSERT',
    onChange: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-cost'] })
    },
    enabled: !!profile
  })

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch
  }
}