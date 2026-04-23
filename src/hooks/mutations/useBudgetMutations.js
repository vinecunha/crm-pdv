// src/hooks/mutations/useBudgetMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as budgetService from '@services/budget/budgetService'

export const useBudgetMutations = (callbacks = {}) => {
  const queryClient = useQueryClient()
  const { logCreate, logUpdate } = useSystemLogs()

  const {
    onBudgetCreated,
    onBudgetUpdated,
    onBudgetConverted,
    onError
  } = callbacks

  const createBudget = useMutation({
    mutationFn: ({ cart, customer, coupon, discount, notes, validUntil }) =>
      budgetService.createBudget({ cart, customer, coupon, discount, notes, validUntil }),
    onSuccess: async (data) => {
      await logCreate('budget', data.id, { budget_number: data.budget_number })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      onBudgetCreated?.(data)
    },
    onError: (error) => onError?.(error)
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) =>
      budgetService.updateBudgetStatus(id, status),
    onSuccess: async (data, variables) => {
      await logUpdate('budget', variables.id, { status: variables.status }, data)
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      onBudgetUpdated?.(data)
    },
    onError: (error) => onError?.(error)
  })

  const convertToSale = useMutation({
    mutationFn: ({ budget, budgetItems }) =>
      budgetService.convertBudgetToSale(budget, budgetItems),
    onSuccess: async (data) => {
      await logCreate('sale', data.id, { 
        sale_number: data.sale_number, 
        converted_from: 'budget' 
      })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      onBudgetConverted?.(data)
    },
    onError: (error) => onError?.(error)
  })

  const isMutating = createBudget.isPending || updateStatus.isPending || convertToSale.isPending

  return {
    createBudget,
    updateStatus,
    convertToSale,
    isMutating
  }
}
