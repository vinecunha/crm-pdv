import React from 'react'
import { formatCurrency } from '@utils/formatters'

const BudgetItemsList = ({ items = [] }) => {
  if (items.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
        Nenhum item encontrado
      </p>
    )
  }
  
  return (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
        >
          <div>
            <span className="text-gray-700 dark:text-gray-300 text-sm">
              {item.product_name}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
              x{item.quantity} {item.unit}
            </span>
          </div>
          <span className="font-medium dark:text-white text-sm">
            {formatCurrency(item.total_price)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default BudgetItemsList
