import { useQuery } from '@tanstack/react-query'
import * as salesListService from '@services/sale/salesListService'

// Baseado em: public.sales
interface Sale {
  id: number
  sale_number: string
  customer_id: number | null
  customer_name: string | null
  customer_phone: string | null
  total_amount: number
  discount_amount: number | null
  discount_percent: number | null
  coupon_code: string | null
  final_amount: number
  payment_method: string | null
  payment_status: string | null
  status: string | null
  notes: string | null
  created_at: string | null
  created_by: string | null
  updated_at: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancellation_reason: string | null
  cancellation_notes: string | null
  approved_by: string | null
  created_by_name: string | null
}

// Baseado em: public.sale_items
interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
  total_price: number
  created_at: string | null
}

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