import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@contexts/AuthContext'
import { useSystemLogs } from './useSystemLogs'
import * as budgetService from '@services/budgetService'

const useBudgetMutations = () => {
  const { profile } = useAuth()
  const { logCreate, logAction, logError } = useSystemLogs()
  const queryClient = useQueryClient()
  
  const createBudget = useMutation({
    mutationFn: ({ cart, customer, coupon, discount, notes, validUntil }) => 
      budgetService.createBudget(cart, customer, coupon, discount, profile, notes, validUntil),
    onSuccess: async (budget) => {
      await logCreate('budget', budget.id, {
        budget_number: budget.budget_number,
        total_amount: budget.total_amount,
        discount: budget.discount_amount,
        final_amount: budget.final_amount
      })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
    onError: async (error) => {
      await logError('budget', error, { action: 'create' })
    }
  })
  
  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => 
      budgetService.updateBudgetStatus(id, status, profile),
    onSuccess: async (data) => {
      await logAction({
        action: 'UPDATE_BUDGET_STATUS',
        entityType: 'budget',
        entityId: data.id,
        details: { new_status: data.status }
      })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
    onError: (error) => {
      console.error('Erro ao atualizar status:', error)
    }
  })
  
  const convertToSale = useMutation({
    mutationFn: ({ budget, budgetItems }) => 
      budgetService.convertBudgetToSale(budget, budgetItems, profile),
    onSuccess: async (sale) => {
      await logCreate('sale', sale.id, {
        sale_number: sale.sale_number,
        total_amount: sale.total_amount,
        final_amount: sale.final_amount,
        converted_from_budget: sale.converted_from_budget
      })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['products-active'] })
    },
    onError: async (error) => {
      await logError('sale', error, { action: 'convert_budget' })
    }
  })
  
  const isMutating = 
    createBudget.isPending || 
    updateStatus.isPending || 
    convertToSale.isPending
  
  return {
    createBudget,
    updateStatus,
    convertToSale,
    isMutating
  }
}

export default useBudgetMutations