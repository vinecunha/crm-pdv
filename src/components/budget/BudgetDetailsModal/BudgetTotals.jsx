import React from 'react'
import { formatCurrency } from '@utils/formatters'

const TotalRow = ({ label, value, highlight = false, className = "" }) => (
  <div className={`flex justify-between ${className}`}>
    <span className={highlight ? 'dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
      {label}
    </span>
    <span className={highlight ? 'text-blue-600 dark:text-blue-400' : 'dark:text-white'}>
      {formatCurrency(value)}
    </span>
  </div>
)

const BudgetTotals = ({ budget }) => {
  return (
    <div className="border-t dark:border-gray-700 pt-3 space-y-1">
      <TotalRow 
        label="Subtotal" 
        value={budget.total_amount} 
        className="text-sm"
      />
      
      {budget.discount_amount > 0 && (
        <TotalRow 
          label={
            <span className="text-green-600 dark:text-green-400">
              Desconto {budget.coupon_code && `(${budget.coupon_code})`}
            </span>
          }
          value={-budget.discount_amount}
          className="text-sm text-green-600 dark:text-green-400"
        />
      )}
      
      <TotalRow 
        label="Total" 
        value={budget.final_amount} 
        highlight 
        className="font-bold pt-2 border-t dark:border-gray-700 text-base"
      />
    </div>
  )
}

export default BudgetTotals