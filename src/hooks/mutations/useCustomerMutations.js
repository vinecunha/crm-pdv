// src/hooks/mutations/useCustomerMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as customerService from '@services/customer/customerService'

export const useCustomerMutations = () => {
  const queryClient = useQueryClient()
  const { logCreate, logUpdate, logDelete, logError } = useSystemLogs()

  const createMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: async (data) => {
      await logCreate('customer', data.id, data)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
    onError: async (error) => {
      await logError('customer', error, { action: 'create' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customerService.updateCustomer(id, data),
    onSuccess: async (data, variables) => {
      await logUpdate('customer', data.id, variables, data)
      queryClient.invalidateQueries({ queryKey: ['customers'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: async (id) => {
      await logDelete('customer', id)
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
