import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as customerService from '@services/customer/customerService'
import type { Customer } from '@/types'

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

export const useCustomerMutations = (callbacks?: { 
  onSuccess?: (data: Customer, action: string) => void; 
  onError?: (error: Error) => void 
}): UseCustomerMutationsReturn => {
  const queryClient = useQueryClient()
  const { logCreate, logUpdate, logDelete, logError } = useSystemLogs()
  const { onSuccess, onError } = callbacks || {}

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => customerService.createCustomer(data),
    onSuccess: async (data: Customer) => {
      await logCreate('customer', data.id.toString(), data)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onSuccess?.(data, 'create')
    },
    onError: async (error: Error) => {
      await logError('customer', error, { action: 'create' })
      onError?.(error)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CustomerFormData> }) => 
      customerService.updateCustomer(id, data),
    onSuccess: async (data: Customer, variables: { id: number; data: Partial<CustomerFormData> }) => {
      await logUpdate('customer', data.id.toString(), variables, data)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      onSuccess?.(data, 'update')
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