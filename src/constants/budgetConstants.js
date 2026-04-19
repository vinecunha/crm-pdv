export const BUDGET_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  CONVERTED: 'converted'
}

export const STATUS_CONFIG = {
  [BUDGET_STATUS.PENDING]: { 
    label: 'Pendente', 
    variant: 'warning', 
    icon: Clock 
  },
  [BUDGET_STATUS.APPROVED]: { 
    label: 'Aprovado', 
    variant: 'success', 
    icon: CheckCircle 
  },
  // ...
}

export const BUDGET_COLUMNS = [
  {
    key: 'budget_number',
    header: 'Nº Orçamento',
    sortable: true,
    render: (row) => <BudgetNumberCell budget={row} />
  },
  // ...
]

export const BUDGET_ACTIONS = [
  {
    id: 'details',
    label: 'Ver detalhes',
    icon: Eye,
    className: 'text-gray-500 dark:text-gray-400 hover:text-blue-600...'
  },
  
]