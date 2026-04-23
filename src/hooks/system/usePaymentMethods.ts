import { useQuery, UseQueryOptions } from '@tanstack/react-query'

interface PaymentMethod {
  id: number
  name: string
  type: string
  is_active: boolean
  [key: string]: unknown
}

interface PaymentMethodsSummary {
  methods: PaymentMethod[]
  total: number
  [key: string]: unknown
}

interface UsePaymentMethodsOptions extends Omit<UseQueryOptions<PaymentMethodsSummary, Error>, 'queryKey' | 'queryFn'> {
  enabled?: boolean
}

export const usePaymentMethods = (options: UsePaymentMethodsOptions = {}) => {
  return useQuery<PaymentMethodsSummary, Error>({
    queryKey: ['payment-methods-summary'],
    queryFn: async (): Promise<PaymentMethodsSummary> => {
      const response = await fetch('/api/payment-methods/summary')
      if (!response.ok) throw new Error('Erro ao carregar formas de pagamento')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    ...options
  })
}