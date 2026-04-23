// src/hooks/mutations/useCashierMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as cashierService from '@services/cashier/cashierService'

export const useCashierMutations = () => {
  const queryClient = useQueryClient()
  const { logCreate } = useSystemLogs()

  const closingMutation = useMutation({
    mutationFn: ({ closingData, profile }) =>
      cashierService.createCashierClosing({ closingData, profile }),
    onSuccess: async (result) => {
      await logCreate('cashier_closing', result.data.id, {
        closing_date: result.data.closing_date,
        expected_total: result.expectedTotal,
        declared_total: result.totalDeclared,
        difference: result.difference
      })
      queryClient.invalidateQueries({ queryKey: ['closing-history'] })
      queryClient.invalidateQueries({ queryKey: ['cashier-summary'] })
    },
  })

  return {
    closingMutation,
    isPending: closingMutation.isPending
  }
}
