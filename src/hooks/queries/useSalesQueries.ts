import { useQuery } from '@tanstack/react-query'
import * as saleService from '@services/sale/saleService'

// Baseado em: public.products (apenas ativos)
interface Product {
  id: number
  code: string | null
  name: string
  description: string | null
  category: string | null
  unit: string | null
  price: number | null
  cost_price: number | null
  stock_quantity: number | null
  reserved_quantity: number | null
  min_stock: number | null
  max_stock: number | null
  location: string | null
  brand: string | null
  weight: number | null
  is_active: boolean | null
  created_at: string | null
  updated_at: string | null
  created_by: string | null
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
}

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