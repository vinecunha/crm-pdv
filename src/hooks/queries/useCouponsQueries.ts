import { useQuery } from '@tanstack/react-query'
import * as couponService from '@services/coupon/couponService'

// Baseado em: public.coupons
interface Coupon {
  id: number
  code: string
  name: string
  description: string | null
  discount_type: 'fixed' | 'percent'
  discount_value: number
  max_discount: number | null
  min_purchase: number | null
  is_global: boolean | null
  is_active: boolean | null
  valid_from: string | null
  valid_to: string | null
  usage_limit: number | null
  used_count: number | null
  created_at: string | null
  created_by: string | null
  updated_at: string | null
  updated_by: string | null
  deleted_at: string | null
  deleted_by: string | null
}

// Baseado em: public.customers (apenas ativos)
interface Customer {
  id: number
  name: string
  email: string
  phone: string
  [key: string]: unknown
}

// Baseado em: public.coupon_allowed_customers
interface AllowedCustomer {
  id: number
  coupon_id: number | null
  customer_id: number | null
  created_at: string | null
}

interface Filters {
  [key: string]: string | boolean | null
}

interface UseCouponsQueriesProps {
  searchTerm: string
  filters: Filters
  editingCoupon: Coupon | null
}

interface UseCouponsQueriesReturn {
  coupons: Coupon[]
  isLoadingCoupons: boolean
  couponsError: Error | null
  refetchCoupons: () => Promise<unknown>
  isFetchingCoupons: boolean
  customers: Customer[]
  allowedCustomers: AllowedCustomer[]
}

export const useCouponsQueries = ({
  searchTerm,
  filters,
  editingCoupon
}: UseCouponsQueriesProps): UseCouponsQueriesReturn => {
  
  const { 
    data: coupons = [], 
    isLoading: isLoadingCoupons,
    error: couponsError,
    refetch: refetchCoupons,
    isFetching: isFetchingCoupons
  } = useQuery<Coupon[]>({
    queryKey: ['coupons', { searchTerm, filters }],
    queryFn: () => couponService.fetchCoupons(searchTerm, filters),
    staleTime: 0,
    refetchOnMount: true,
  })

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers-active'],
    queryFn: couponService.fetchCustomers,
    staleTime: 5 * 60 * 1000,
  })

  const { data: allowedCustomers = [] } = useQuery<AllowedCustomer[]>({
    queryKey: ['allowed-customers', editingCoupon?.id],
    queryFn: () => couponService.fetchAllowedCustomers(editingCoupon?.id as number),
    enabled: !!editingCoupon?.id && !editingCoupon?.is_global,
  })

  return {
    coupons,
    isLoadingCoupons,
    couponsError,
    refetchCoupons,
    isFetchingCoupons,
    customers,
    allowedCustomers
  }
}