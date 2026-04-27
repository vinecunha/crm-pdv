import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@contexts/AuthContext'
import { useSystemLogs } from '@hooks/system/useSystemLogs'
import * as budgetService from '@services/budget/budgetService'
import type { Budget, CartItem, Customer, Coupon, Discount } from '@/types'

interface Sale {
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
  const { profile } = useAuth()
  const { logCreate, logUpdate } = useSystemLogs()

  const {
    onBudgetCreated,
    onBudgetUpdated,
    onBudgetConverted,
    onError
  } = callbacks

  const createBudget = useMutation({
    mutationFn: ({ cart, customer, coupon, discount, notes, validUntil }: CreateBudgetParams) =>
      budgetService.createBudget(cart, customer, coupon, discount, profile, notes, validUntil),
    onSuccess: async (data: Budget) => {
      await logCreate('budget', data.id.toString(), { budget_number: data.budget_number })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      onBudgetCreated?.(data)
    },
    onError: (error: Error) => onError?.(error)
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: UpdateStatusParams) =>
      budgetService.updateBudgetStatus(id, status, profile),
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