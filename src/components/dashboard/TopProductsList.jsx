import React from 'react'
import { Package } from '@lib/icons'
import { formatNumber } from '@utils/formatters'

const TopProductsList = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
        <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-sm">Nenhuma venda registrada ainda</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 sm:space-y-3">
      {products.map((product, index) => (
        <div 
          key={product.id || index} 
          className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold ${
              index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
              index === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
              index === 2 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
              'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            }`}>
              {index + 1}
            </div>
            <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[120px] sm:max-w-none">
              {product.name}
            </span>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {formatNumber(product.quantity)}
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">unidades</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default TopProductsList
