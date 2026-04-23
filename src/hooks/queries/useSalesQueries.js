// src/hooks/queries/useSalesQueries.js
import { useQuery } from '@tanstack/react-query'
import * as saleService from '@services/sale/saleService'

export const useSalesQueries = () => {
  const { 
    data: products = [], 
    isLoading,
    refetch: refetchProducts 
  } = useQuery({
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
