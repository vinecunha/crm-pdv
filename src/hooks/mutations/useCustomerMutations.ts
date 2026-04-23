import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
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
  [key: string]: unknown
}

interface CustomerFormData {
  name: string
  email: string
  phone: string
  document?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  birth_date?: string | null
  status?: string
}

interface UseCustomerMutationsReturn {
  createMutation: ReturnType<typeof useMutation>
  updateMutation: ReturnType<typeof useMutation>
  deleteMutation: ReturnType<typeof useMutation>
  isMutating: boolean
}

export const useCustomerMutations = (): UseCustomerMutationsReturn => {
  const queryClient = useQueryClient()
  const { logCreate, logUpdate, logDelete, logError } = useSystemLogs()

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customerService.createCustomer(data),
    onSuccess: async (data: Customer) => {
      await logCreate('customer', data.id.toString(), data)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: async (error: Error) => {
      await logError('customer', error, { action: 'create' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerFormData> }) => 
      customerService.updateCustomer(id, data),
    onSuccess: async (data: Customer, variables: { id: number; data: Partial<CustomerFormData> }) => {
      await logUpdate('customer', data.id.toString(), variables, data)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customerService.deleteCustomer(id),
    onSuccess: async (id: number) => {
      await logDelete('customer', id.toString(), {})
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    isMutating
  }
}