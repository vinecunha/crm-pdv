// src/hooks/queries/useSalesListQueries.js
import { useQuery } from '@tanstack/react-query'
import * as salesListService from '@services/sale/salesListService'

export const useSalesListQueries = ({ debouncedSearchTerm, filters, selectedSale, showDetailsModal }) => {
  // Query de vendas
  const { 
    data: sales = [], 
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ['sales', { searchTerm: debouncedSearchTerm, filters }],
    queryFn: () => salesListService.fetchSales(debouncedSearchTerm, filters),
    staleTime: 2 * 60 * 1000,
  })

  // Query de itens da venda (para detalhes)
  const { 
    data: saleItems = [],
    isLoading: isLoadingItems
  } = useQuery({
    queryKey: ['sale-items', selectedSale?.id],
    queryFn: () => salesListService.fetchSaleItems(selectedSale?.id),
    enabled: !!selectedSale?.id && showDetailsModal,
  })

  return {
    sales,
    isLoading,
    error,
    refetch,
    isFetching,
    saleItems,
    isLoadingItems
  }
}
