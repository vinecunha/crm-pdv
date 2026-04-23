// src/hooks/queries/useProductsQueries.js
import { useQuery } from '@tanstack/react-query'
import * as productService from '@services/product/productService'

export const useProductsQueries = ({ canViewOnlyActive, viewingProductId, searchTerm, activeFilters, products }) => {
  // Query principal de produtos
  const { 
    data: productsData = [], 
    isLoading,
    error: productsError,
    refetch: refetchProducts,
    isFetching
  } = useQuery({
    queryKey: ['products', { canViewOnlyActive }],
    queryFn: () => productService.fetchProducts(canViewOnlyActive),
    staleTime: 2 * 60 * 1000,
  })

  // Query de detalhes do produto
  const { 
    data: productDetails,
    isLoading: isLoadingDetails
  } = useQuery({
    queryKey: ['product-details', viewingProductId],
    queryFn: () => productService.fetchProductDetails(viewingProductId),
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
