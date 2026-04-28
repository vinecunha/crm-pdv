import { useQuery } from '@tanstack/react-query'
import * as couponService from '@services/coupon/couponService'
import type { Coupon, Customer } from '@/types'

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