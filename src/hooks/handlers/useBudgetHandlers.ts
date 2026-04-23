import { useCallback } from 'react'
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
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'converted'
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

interface Feedback {
  showError: (message: string) => void
  showInfo: (message: string) => void
}

interface MutationResult<T> {
  mutate: (data: T, options?: { onSuccess?: (data?: unknown) => void; onError?: (error: Error) => void }) => void
}

interface Modals {
  openDetails: (budget: Budget) => void
  openClearCartConfirm: () => void
  openQuickCustomer: (data: { phone: string }) => void
  openCustomer: () => void
  closeAll: () => void
  closeDetails: () => void
  closeQuickCustomer: () => void
  closeCustomer: () => void
  closeCoupon: () => void
  closeClearCartConfirm: () => void
  selectedBudget: Budget | null
  budgetItems: BudgetItem[]
  setBudgetItems: (items: BudgetItem[]) => void
  quickCustomer: {
    form: CustomerFormData
    errors: Record<string, string>
  }
  setQuickCustomerErrors: (errors: Record<string, string>) => void
  resetQuickCustomerForm: () => void
  customerPhone: string
  couponError: string
  setCouponError: (error: string) => void
}

interface CustomerFormData {
  name?: string
  phone?: string
  email?: string
  [key: string]: unknown
}

interface UseBudgetHandlersProps {
  cart: CartItem[]
  customer: Customer | null
  coupon: Coupon | null
  discount: Discount
  notes: string
  validUntil: string
  subtotal: number
  couponCode: string
  createBudget: MutationResult<{
    cart: CartItem[]
    customer: Customer | null
    coupon: Coupon | null
    discount: Discount
    notes: string
    validUntil: string
  }>
  updateStatus: MutationResult<{
    id: number
    status: string
  }>
  convertToSale: MutationResult<{
    budget: Budget
    budgetItems: BudgetItem[]
  }>
  validateCoupon: MutationResult<{
    code: string
    customerId: number
    cartSubtotal: number
  }>
  searchCustomer: MutationResult<string>
  createCustomer: MutationResult<CustomerFormData>
  clearCart: () => void
  clearCustomer: () => void
  removeCoupon: () => void
  setMode: (mode: string) => void
  modals: Modals
  feedback: Feedback
}

interface UseBudgetHandlersReturn {
  handleCreateBudget: () => void
  handleViewDetails: (budget: Budget) => Promise<void>
  handleApprove: (budget: Budget) => void
  handleReject: (budget: Budget) => void
  handleConvertToSale: () => void
  handleQuickRegisterCustomer: () => void
  handleSearchCustomer: () => void
  handleApplyCoupon: (couponToValidate?: Coupon | null) => void
  handleClearCart: () => void
  confirmClearCart: () => void
}

export const useBudgetHandlers = ({
  cart,
  customer,
  coupon,
  discount,
  notes,
  validUntil,
  subtotal,
  couponCode,
  createBudget,
  updateStatus,
  convertToSale,
  validateCoupon,
  searchCustomer,
  createCustomer,
  clearCart,
  clearCustomer,
  removeCoupon,
  setMode,
  modals,
  feedback
}: UseBudgetHandlersProps): UseBudgetHandlersReturn => {
  
  const handleCreateBudget = useCallback(() => {
    if (cart.length === 0) {
      feedback.showError('Adicione itens ao orçamento')
      return
    }
    
    createBudget.mutate(
      { cart, customer, coupon, discount, notes, validUntil },
      {
        onSuccess: () => {
          clearCart()
          clearCustomer()
          removeCoupon()
          setMode('list')
        }
      }
    )
  }, [cart, customer, coupon, discount, notes, validUntil, createBudget, clearCart, clearCustomer, removeCoupon, setMode, feedback])

  const handleViewDetails = useCallback(async (budget: Budget) => {
    modals.openDetails(budget)
    try {
      const items = await budgetService.fetchBudgetItems(budget.id)
      modals.setBudgetItems(items as BudgetItem[])
    } catch (error) {
      modals.setBudgetItems([])
    }
  }, [modals])

  const handleApprove = useCallback((budget: Budget) => {
    updateStatus.mutate(
      { id: budget.id, status: 'approved' },
      { onSuccess: () => modals.closeAll() }
    )
  }, [updateStatus, modals])

  const handleReject = useCallback((budget: Budget) => {
    updateStatus.mutate(
      { id: budget.id, status: 'rejected' },
      { onSuccess: () => modals.closeAll() }
    )
  }, [updateStatus, modals])

  const handleConvertToSale = useCallback(() => {
    if (!modals.selectedBudget) return
    
    convertToSale.mutate(
      { budget: modals.selectedBudget, budgetItems: modals.budgetItems },
      { onSuccess: () => modals.closeAll() }
    )
  }, [modals.selectedBudget, modals.budgetItems, convertToSale, modals])

  const handleQuickRegisterCustomer = useCallback(() => {
    const { form, errors } = modals.quickCustomer
    
    if (!form.name?.trim()) {
      modals.setQuickCustomerErrors({ name: 'Nome é obrigatório' })
      return
    }
    
    if (!form.phone?.trim() || form.phone.length < 10) {
      modals.setQuickCustomerErrors({ phone: 'Telefone inválido' })
      return
    }
    
    createCustomer.mutate(form, {
      onSuccess: () => {
        modals.closeQuickCustomer()
        modals.resetQuickCustomerForm()
      }
    })
  }, [modals, createCustomer])

  const handleSearchCustomer = useCallback(() => {
    const phone = modals.customerPhone
    
    if (!phone || phone.length < 10) {
      feedback.showError('Digite um telefone válido')
      return
    }
    
    searchCustomer.mutate(phone, {
      onSuccess: (data: unknown) => {
        modals.closeCustomer()
        if (!data) {
          modals.openQuickCustomer({ phone })
        }
      }
    })
  }, [modals, searchCustomer, feedback])

  const handleApplyCoupon = useCallback((couponToValidate: Coupon | null = null) => {
    const code = couponToValidate?.code || couponCode
    
    if (!code) {
      modals.setCouponError('Digite o código do cupom')
      return
    }
    
    if (!customer) {
      modals.setCouponError('Identifique um cliente para usar cupons')
      return
    }
    
    validateCoupon.mutate(
      { code, customerId: customer.id, cartSubtotal: subtotal },
      {
        onSuccess: () => {
          modals.closeCoupon()
          modals.setCouponError('')
        },
        onError: (error: Error) => {
          modals.setCouponError(error.message)
        }
      }
    )
  }, [couponCode, customer, subtotal, validateCoupon, modals])

  const handleClearCart = useCallback(() => {
    if (cart.length === 0) return
    modals.openClearCartConfirm()
  }, [cart.length, modals])

  const confirmClearCart = useCallback(() => {
    clearCart()
    modals.closeClearCartConfirm()
    feedback.showInfo('Carrinho limpo')
  }, [clearCart, modals, feedback])

  return {
    handleCreateBudget,
    handleViewDetails,
    handleApprove,
    handleReject,
    handleConvertToSale,
    handleQuickRegisterCustomer,
    handleSearchCustomer,
    handleApplyCoupon,
    handleClearCart,
    confirmClearCart
  }
}