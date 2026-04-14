import { useQuery } from '@tanstack/react-query'

export const useUserSales = (filters = {}, options = {}) => {
  return useQuery({
    queryKey: ['user-sales-performance', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams(filters).toString()
      const url = `/api/user-sales/performance${queryParams ? `?${queryParams}` : ''}`
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Erro ao carregar desempenho dos operadores')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
    ...options
  })
}