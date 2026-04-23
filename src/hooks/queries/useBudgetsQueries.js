// src/hooks/queries/useBudgetsQueries.js
import { useQuery } from '@tanstack/react-query'
import * as budgetService from '@services/budget/budgetService'

export const useBudgetsQueries = ({ searchTerm, statusFilter, mode, customer }) => {
  // Query de orçamentos
  const { 
    data: budgets = [], 
    isLoading: loadingBudgets, 
    refetch: refetchBudgets 
  } = useQuery({
    queryKey: ['budgets', { searchTerm, status: statusFilter }],
    queryFn: () => budgetService.fetchBudgets(searchTerm, statusFilter),
    enabled: mode === 'list',
  })

  // Query de produtos (para criação de orçamento)
  const { 
    data: products = [], 
    isLoading: loadingProducts 
  } = useQuery({
    queryKey: ['products-active-budget'],
    queryFn: budgetService.fetchProducts,
    staleTime: 2 * 60 * 1000,
    enabled: mode === 'create',
  })

  // Query de cupons disponíveis
  const { data: availableCoupons = [] } = useQuery({
    queryKey: ['available-coupons-budget', customer?.id],
    queryFn: () => budgetService.fetchAvailableCoupons(customer?.id),
    enabled: mode === 'create' && !!customer,
  })

  return {
    budgets,
    loadingBudgets,
    refetchBudgets,
    products,
    loadingProducts,
    availableCoupons
  }
}
