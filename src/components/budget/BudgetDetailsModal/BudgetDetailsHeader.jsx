import React from 'react'

const BudgetDetailsHeader = ({ budget }) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 sm:p-4">
      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">
        CLIENTE
      </p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-medium">
          {budget.customer_name?.charAt(0) || 'C'}
        </div>
        <div>
          <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">
            {budget.customer_name || 'Cliente não identificado'}
          </p>
          {budget.customer_phone && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {budget.customer_phone}
            </p>
          )}
          {budget.customer_email && (
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              {budget.customer_email}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default BudgetDetailsHeader