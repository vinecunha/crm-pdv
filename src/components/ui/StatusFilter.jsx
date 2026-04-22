import React from 'react'
import { BUDGET_STATUS } from '@utils/budgetConstants'

const StatusFilter = ({ 
  value = 'all', 
  onChange, 
  className = "" 
}) => {
  const options = [
    { value: 'all', label: 'Todos' },
    { value: BUDGET_STATUS.PENDING, label: 'Pendentes' },
    { value: BUDGET_STATUS.APPROVED, label: 'Aprovados' },
    { value: BUDGET_STATUS.REJECTED, label: 'Rejeitados' },
    { value: BUDGET_STATUS.EXPIRED, label: 'Expirados' },
    { value: BUDGET_STATUS.CONVERTED, label: 'Convertidos' }
  ]
  
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`flex-1 sm:flex-none px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg ${className}`}
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export default StatusFilter