import { useQuery } from '@tanstack/react-query'
import * as saleService from '@services/sale/saleService'
import type { Product } from '@/types'

interface UseSalesQueriesReturn {
  products: Product[]
  isLoading: boolean
  refetchProducts: () => Promise<unknown>
}

export const useSalesQueries = (): UseSalesQueriesReturn => {
  const { 
    data: products = [], 
    isLoading,
    refetch: refetchProducts 
  } = useQuery<Product[]>({
    queryKey: ['products-active'],
    queryFn: saleService.fetchProducts,
    staleTime: 0, 
    gcTime: 0,
    refetchOnMount: true,
  })

  return {
    products,
    isLoading,
    refetchProducts
  }
}