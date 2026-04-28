import { useQuery } from '@tanstack/react-query'
import * as salesListService from '@services/sale/salesListService'
import type { Sale, SaleItem } from '@/types'

interface Filters {
  [key: string]: string | boolean | null
}

interface UseSalesListQueriesProps {
  debouncedSearchTerm: string
  filters: Filters
  selectedSale: Sale | null
  showDetailsModal: boolean
}

interface UseSalesListQueriesReturn {
  sales: Sale[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<unknown>
  isFetching: boolean
  saleItems: SaleItem[]
  isLoadingItems: boolean
}

export const useSalesListQueries = ({
  debouncedSearchTerm,
  filters,
  selectedSale,
  showDetailsModal
}: UseSalesListQueriesProps): UseSalesListQueriesReturn => {
  
  const { 
    data: sales = [], 
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery<Sale[]>({
    queryKey: ['sales', { searchTerm: debouncedSearchTerm, filters }],
    queryFn: () => salesListService.fetchSales(debouncedSearchTerm, filters),
    staleTime: 2 * 60 * 1000,
  })

  const { 
    data: saleItems = [],
    isLoading: isLoadingItems
  } = useQuery<SaleItem[]>({
    queryKey: ['sale-items', selectedSale?.id],
    queryFn: () => salesListService.fetchSaleItems(selectedSale?.id as number),
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