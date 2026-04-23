import { useQuery } from '@tanstack/react-query'
import * as productService from '@services/product/productService'

// Baseado em: public.products
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