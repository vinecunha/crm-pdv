// src/hooks/dashboard/usePaymentMethods.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@contexts/AuthContext'
import { useRealtime } from '@/hooks/utils/useRealTime'
import { fetchPaymentMethods, PaymentMethodData } from '@services/dashboard/paymentMethodsService'

interface UsePaymentMethodsReturn {
  data: PaymentMethodData[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<unknown>
}

export function usePaymentMethods(months: number = 6): UsePaymentMethodsReturn {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - months)

  const { data = [], isLoading, error, refetch } = useQuery<PaymentMethodData[]>({
    queryKey: ['payment-methods', profile?.id, profile?.role, months],
    queryFn: () => fetchPaymentMethods({ 
      startDate, 
      userId: profile?.id, 
      role: profile?.role 
    }),
    enabled: !!profile,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true
  })

  // =============================================
  // REALTIME: Mesmo padrão do useRevenueCost
  // =============================================
  
  // Quando uma nova venda é concluída
  useRealtime({
    table: 'sales',
    event: 'INSERT',
    onChange: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
    },
    enabled: !!profile
  })

  // Quando uma venda é atualizada (cancelada, estornada, etc)
  useRealtime({
    table: 'sales',
    event: 'UPDATE',
    onChange: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
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