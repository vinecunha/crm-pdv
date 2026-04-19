import { formatCurrency, formatDate } from './formatters'

export const BUDGET_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CONVERTED: 'converted'
}

export const calculateSubtotal = (cart) => {
  return cart.reduce((sum, item) => sum + (item.total || item.price * item.quantity), 0)
}

export const calculateTotal = (subtotal, discount = 0) => {
  return Math.max(0, subtotal - discount)
}

export const validateBudget = (cart, customer) => {
  const errors = []
  
  if (!cart || cart.length === 0) {
    errors.push('Adicione pelo menos um item ao orçamento')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const formatBudgetNumber = (number) => `#${number}`

export const isBudgetExpired = (validUntil) => {
  if (!validUntil) return false
  return new Date(validUntil) < new Date()
}

export const getBudgetStatusConfig = (status) => {
  const configs = {
    [BUDGET_STATUS.PENDING]: {
      label: 'Pendente',
      variant: 'warning',
      color: 'yellow'
    },
    [BUDGET_STATUS.APPROVED]: {
      label: 'Aprovado',
      variant: 'success',
      color: 'green'
    },
    [BUDGET_STATUS.REJECTED]: {
      label: 'Rejeitado',
      variant: 'danger',
      color: 'red'
    },
    [BUDGET_STATUS.EXPIRED]: {
      label: 'Expirado',
      variant: 'secondary',
      color: 'gray'
    },
    [BUDGET_STATUS.CONVERTED]: {
      label: 'Convertido',
      variant: 'info',
      color: 'purple'
    }
  }
  
  return configs[status] || configs[BUDGET_STATUS.PENDING]
}

export const groupBudgetsByStatus = (budgets) => {
  return budgets.reduce((acc, budget) => {
    const status = budget.status || BUDGET_STATUS.PENDING
    if (!acc[status]) acc[status] = []
    acc[status].push(budget)
    return acc
  }, {})
}

export const sortBudgetItems = (items, sortBy = 'name') => {
  return [...items].sort((a, b) => {
    if (sortBy === 'price') return b.price - a.price
    if (sortBy === 'quantity') return b.quantity - a.quantity
    return a.name.localeCompare(b.name)
  })
}

export const generateBudgetSummary = (budget) => {
  return {
    number: formatBudgetNumber(budget.budget_number),
    customer: budget.customer_name || 'Cliente não identificado',
    date: formatDate(budget.created_at),
    validUntil: formatDate(budget.valid_until),
    subtotal: formatCurrency(budget.total_amount),
    discount: formatCurrency(budget.discount_amount || 0),
    total: formatCurrency(budget.final_amount),
    status: getBudgetStatusConfig(budget.status)
  }
}