import { useQuery } from '@tanstack/react-query'
import * as budgetService from '@services/budget/budgetService'

// Baseado em: public.budgets
interface Budget {
  id: number
  budget_number: number
  customer_id: number | null
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  total_amount: number
  discount_amount: number | null
  discount_percent: number | null
  coupon_code: string | null
  final_amount: number
  status: string | null
  valid_until: string | null
  notes: string | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  approved_by: string | null
  approved_at: string | null
  converted_sale_id: number | null
}

// Baseado em: public.products
interface Product {
  id: number
  code: string | null
  name: string
  description: string | null
  category: string | null
  unit: string | null
  price: number | null
  cost_price: number | null
  stock_quantity: number | null
  is_active: boolean | null
  [key: string]: unknown
}

// Baseado em: public.coupons
interface Coupon {
  id: number
  code: string
  name: string
  description: string | null
  discount_type: 'fixed' | 'percent'
  discount_value: number
  max_discount: number | null
  min_purchase: number | null
  is_global: boolean | null
  is_active: boolean | null
  valid_from: string | null
  valid_to: string | null
  usage_limit: number | null
  used_count: number | null
  [key: string]: unknown
}

// Baseado em: public.customers (campos relevantes)
interface Customer {
  id: number
  name: string
  email: string
  phone: string
  [key: string]: unknown
}

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