import { useQuery } from '@tanstack/react-query'
import * as productService from '@services/product/productService'
import type { Product } from '@/types'

// Extendendo com campos adicionais específicos da query
interface ExtendedProduct extends Product {
  deleted_at: string | null
  deleted_by: string | null
}

interface ProductDetails extends Product {
  entries?: unknown[]
  movements?: unknown[]
  [key: string]: unknown
}

interface ActiveFilters {
  [key: string]: string | boolean | null
}

interface UseProductsQueriesProps {
  canViewOnlyActive: boolean
  viewingProductId: number | null
  searchTerm: string
  activeFilters: ActiveFilters
  products: Product[]
}

interface UseProductsQueriesReturn {
  products: Product[]
  isLoading: boolean
  productsError: Error | null
  refetchProducts: () => Promise<unknown>
  isFetching: boolean
  productDetails: ProductDetails | undefined
  isLoadingDetails: boolean
}

export const useProductsQueries = ({
  canViewOnlyActive,
  viewingProductId,
  searchTerm,
  activeFilters,
  products
}: UseProductsQueriesProps): UseProductsQueriesReturn => {
  
  const { 
    data: productsData = [], 
    isLoading,
    error: productsError,
    refetch: refetchProducts,
    isFetching
  } = useQuery<Product[]>({
    queryKey: ['products', { canViewOnlyActive }],
    queryFn: () => productService.fetchProducts(canViewOnlyActive),
    staleTime: 2 * 60 * 1000,
  })

  const { 
    data: productDetails,
    isLoading: isLoadingDetails
  } = useQuery<ProductDetails>({
    queryKey: ['product-details', viewingProductId],
    queryFn: () => productService.fetchProductDetails(viewingProductId as number),
    enabled: !!viewingProductId,
  })

  return {
    products: productsData,
    isLoading,
    productsError,
    refetchProducts,
    isFetching,
    productDetails,
    isLoadingDetails
  }
}