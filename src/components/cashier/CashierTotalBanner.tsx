// src/components/cashier/CashierTotalBanner.jsx
import React from 'react'
import { ChevronRight } from '@lib/icons'
import { formatCurrency, formatNumber } from '@utils/formatters'

const CashierTotalBanner = ({ summary }) => {
  const resumo = summary?.resumo || {}
  
  return (
    <div className="mt-4 sm:mt-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total do Período</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(resumo.total_liquido || 0)}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          <div className="text-right">
            <p className="text-gray-500 dark:text-gray-400 text-xs">Vendas</p>
            <p className="font-medium dark:text-white">{formatNumber(resumo.total_vendas || 0)}</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
          <div className="text-right">
            <p className="text-gray-500 dark:text-gray-400 text-xs">Descontos</p>
            <p className="font-medium text-orange-600 dark:text-orange-400">
              -{formatCurrency(resumo.total_descontos || 0)}
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
          <div className="text-right">
            <p className="text-gray-500 dark:text-gray-400 text-xs">Cancelamentos</p>
            <p className="font-medium text-red-500 dark:text-red-400">
              {formatCurrency(resumo.total_cancelamentos || 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CashierTotalBanner
