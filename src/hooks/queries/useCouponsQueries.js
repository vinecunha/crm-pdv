// src/hooks/queries/useCouponsQueries.js
import { useQuery } from '@tanstack/react-query'
import * as couponService from '@services/coupon/couponService'

export const useCouponsQueries = ({ searchTerm, filters, editingCoupon }) => {
  // Query principal de cupons
  const { 
    data: coupons = [], 
    isLoading: isLoadingCoupons,
    error: couponsError,
    refetch: refetchCoupons,
    isFetching: isFetchingCoupons
  } = useQuery({
    queryKey: ['coupons', { searchTerm, filters }],
    queryFn: () => couponService.fetchCoupons(searchTerm, filters),
    staleTime: 0,
    refetchOnMount: true,
  })

  // Query de clientes ativos
  const { data: customers = [] } = useQuery({
    queryKey: ['customers-active'],
    queryFn: couponService.fetchCustomers,
    staleTime: 5 * 60 * 1000,
  })

  // Query de clientes permitidos para um cupom específico
  const { data: allowedCustomers = [] } = useQuery({
    queryKey: ['allowed-customers', editingCoupon?.id],
    queryFn: () => couponService.fetchAllowedCustomers(editingCoupon?.id),
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
