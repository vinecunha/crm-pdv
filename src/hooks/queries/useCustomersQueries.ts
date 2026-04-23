import { useQuery } from '@tanstack/react-query'
import * as customerService from '@services/customer/customerService'

// Baseado em: public.customers
interface Customer {
  id: number
  name: string
  email: string
  phone: string
  document: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  birth_date: string | null
  status: string | null
  total_purchases: number | null
  last_purchase: string | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
  deleted_by: string | null
  rfv_score: string | null
  rfv_recency: number | null
  rfv_frequency: number | null
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