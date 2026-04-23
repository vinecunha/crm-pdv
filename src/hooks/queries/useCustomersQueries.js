// src/hooks/queries/useCustomersQueries.js
import { useQuery } from '@tanstack/react-query'
import * as customerService from '@services/customer/customerService'

export const useCustomersQueries = () => {
  const { 
    data: customers = [], 
    isLoading,
    error: customersError,
    refetch: refetchCustomers,
    isFetching
  } = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.fetchCustomers,
    staleTime: 0,
    refetchOnMount: true,
  })

  return {
    customers,
    isLoading,
    customersError,
    refetchCustomers,
    isFetching
  }
}
