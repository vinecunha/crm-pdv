import { useQuery } from '@tanstack/react-query'
import * as budgetService from '@services/budget/budgetService'
import type { Budget, Product, Coupon, Customer } from '@/types'

type BudgetMode = 'list' | 'create'

interface UseBudgetsQueriesProps {
  searchTerm: string
  statusFilter: string
  mode: BudgetMode
  customer: Customer | null
}

interface UseBudgetsQueriesReturn {
  budgets: Budget[]
  loadingBudgets: boolean
  refetchBudgets: () => Promise<unknown>
  products: Product[]
  loadingProducts: boolean
  availableCoupons: Coupon[]
}

export const useBudgetsQueries = ({
  searchTerm,
  statusFilter,
  mode,
  customer
}: UseBudgetsQueriesProps): UseBudgetsQueriesReturn => {
  
  const { 
    data: budgets = [], 
    isLoading: loadingBudgets, 
    refetch: refetchBudgets 
  } = useQuery<Budget[]>({
    queryKey: ['budgets', { searchTerm, status: statusFilter }],
    queryFn: () => budgetService.fetchBudgets(searchTerm, statusFilter),
    enabled: mode === 'list',
  })

  const { 
    data: products = [], 
    isLoading: loadingProducts 
  } = useQuery<Product[]>({
    queryKey: ['products-active-budget'],
    queryFn: budgetService.fetchProducts,
    staleTime: 2 * 60 * 1000,
    enabled: mode === 'create',
  })

  const { data: availableCoupons = [] } = useQuery<Coupon[]>({
    queryKey: ['available-coupons-budget', customer?.id],
    queryFn: () => budgetService.fetchAvailableCoupons(customer?.id as number),
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