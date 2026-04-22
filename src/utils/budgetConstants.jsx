import { formatCurrency, formatDate } from './formatters'
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Check, 
  AlertTriangle 
} from '@lib/icons'
import Badge from '@components/Badge'

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

export const BUDGET_COLUMNS = [
  {
    key: 'budget_number',
    header: 'Nº Orçamento',
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">
          #{row.budget_number}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {formatDate(row.created_at)}
        </p>
      </div>
    )
  },
  {
    key: 'customer_name',
    header: 'Cliente',
    sortable: true,
    render: (row) => (
      <div>
        <p className="text-sm text-gray-900 dark:text-gray-100">
          {row.customer_name || 'Cliente não identificado'}
        </p>
        {row.customer_phone && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {row.customer_phone}
          </p>
        )}
      </div>
    )
  },
  {
    key: 'final_amount',
    header: 'Total',
    sortable: true,
    render: (row) => (
      <div>
        <p className="font-semibold text-gray-900 dark:text-gray-100">
          {formatCurrency(row.final_amount)}
        </p>
        {row.discount_amount > 0 && (
          <p className="text-xs text-green-600 dark:text-green-400">
            -{formatCurrency(row.discount_amount)}
          </p>
        )}
      </div>
    )
  },
  {
    key: 'valid_until',
    header: 'Válido até',
    sortable: true,
    render: (row) => (
      <span
        className={`text-sm ${
          new Date(row.valid_until) < new Date() && row.status === 'pending'
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}
      >
        {formatDate(row.valid_until)}
      </span>
    )
  },
  {
    key: 'status',
    header: 'Status',
    sortable: true,
    render: (row) => {
      const config = getBudgetStatusConfig(row.status)
      const IconComponent = {
        pending: Clock,
        approved: CheckCircle,
        rejected: XCircle,
        expired: AlertTriangle,
        converted: Check
      }[row.status] || Clock
      
      return (
        <Badge variant={config.variant}>
          <IconComponent size={12} className="mr-1" />
          {config.label}
        </Badge>
      )
    }
  }
]

// ============= Ações da Tabela =============
export const BUDGET_ACTIONS = [
  {
    id: 'details',
    label: 'Ver detalhes',
    icon: Eye,
    className: 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30'
  },
  {
    id: 'approve',
    label: 'Aprovar',
    icon: CheckCircle,
    className: 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30',
    disabled: (row) => row.status !== BUDGET_STATUS.PENDING
  },
  {
    id: 'reject',
    label: 'Rejeitar',
    icon: XCircle,
    className: 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30',
    disabled: (row) => row.status !== BUDGET_STATUS.PENDING
  }
]