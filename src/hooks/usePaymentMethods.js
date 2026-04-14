import { useQuery } from '@tanstack/react-query'

export const usePaymentMethods = (options = {}) => {
  return useQuery({
    queryKey: ['payment-methods-summary'],
    queryFn: async () => {
      const response = await fetch('/api/payment-methods/summary')
      if (!response.ok) throw new Error('Erro ao carregar formas de pagamento')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    ...options
  })
}