import { useQuery } from '@tanstack/react-query'
import * as customerService from '@services/customer/customerService'
import type { Customer } from '@/types'

// Extendendo com campos adicionais específicos da query
interface ExtendedCustomer extends Customer {
  rfv_monetary: number | null
}

interface UseCustomersQueriesReturn {
  customers: Customer[]
  isLoading: boolean
  customersError: Error | null
  refetchCustomers: () => Promise<unknown>
  isFetching: boolean
}

export const useCustomersQueries = (): UseCustomersQueriesReturn => {
  const { 
    data: customers = [], 
    isLoading,
    error: customersError,
    refetch: refetchCustomers,
    isFetching
  } = useQuery<Customer[]>({
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