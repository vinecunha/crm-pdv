import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
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

// Baseado em: public.budget_items
interface BudgetItem {
  id: number
  budget_id: number | null
  product_id: number | null
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
  total_price: number
  unit: string | null
  created_at: string | null
}

// Baseado em: public.sales
interface Sale {
  id: number
  sale_number: string
  [key: string]: unknown
}

interface CartItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  [key: string]: unknown
}

interface Customer {
  id: number
  name: string
  email: string
  phone: string
  [key: string]: unknown
}

interface Coupon {
  id: number
  code: string
  discount_type: 'fixed' | 'percent'
  discount_value: number
  [key: string]: unknown
}

interface Discount {
  type: 'fixed' | 'percent'
  value: number
}

interface BudgetCallbacks {
  onBudgetCreated?: (data: Budget) => void
  onBudgetUpdated?: (data: Budget) => void
  onBudgetConverted?: (data: Sale) => void
  onError?: (error: Error) => void
}

interface CreateBudgetParams {
  cart: CartItem[]
  customer: Customer | null
  coupon: Coupon | null
  discount: Discount
  notes: string
  validUntil: string
}

interface UpdateStatusParams {
  id: number
  status: string
}

interface ConvertToSaleParams {
  budget: Budget
  budgetItems: BudgetItem[]
}

interface UseBudgetMutationsReturn {
  createBudget: ReturnType<typeof useMutation>
  updateStatus: ReturnType<typeof useMutation>
  convertToSale: ReturnType<typeof useMutation>
  isMutating: boolean
}

export const useBudgetMutations = (callbacks: BudgetCallbacks = {}): UseBudgetMutationsReturn => {
  const queryClient = useQueryClient()
  const { logCreate, logUpdate } = useSystemLogs()

  const {
    onBudgetCreated,
    onBudgetUpdated,
    onBudgetConverted,
    onError
  } = callbacks

  const createBudget = useMutation({
    mutationFn: ({ cart, customer, coupon, discount, notes, validUntil }: CreateBudgetParams) =>
      budgetService.createBudget({ cart, customer, coupon, discount, notes, validUntil }),
    onSuccess: async (data: Budget) => {
      await logCreate('budget', data.id.toString(), { budget_number: data.budget_number })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      onBudgetCreated?.(data)
    },
    onError: (error: Error) => onError?.(error)
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: UpdateStatusParams) =>
      budgetService.updateBudgetStatus(id, status),
    onSuccess: async (data: Budget, variables: UpdateStatusParams) => {
      await logUpdate('budget', variables.id.toString(), { status: variables.status }, data)
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      onBudgetUpdated?.(data)
    },
    onError: (error: Error) => onError?.(error)
  })

  const convertToSale = useMutation({
    mutationFn: ({ budget, budgetItems }: ConvertToSaleParams) =>
      budgetService.convertBudgetToSale(budget, budgetItems),
    onSuccess: async (data: Sale) => {
      await logCreate('sale', data.id.toString(), { 
        sale_number: data.sale_number, 
        converted_from: 'budget' 
      })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      onBudgetConverted?.(data)
    },
    onError: (error: Error) => onError?.(error)
  })

  const isMutating = createBudget.isPending || updateStatus.isPending || convertToSale.isPending

  return {
    createBudget,
    updateStatus,
    convertToSale,
    isMutating
  }
}