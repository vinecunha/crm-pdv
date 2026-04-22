import React from 'react'
import { formatCurrency } from '@utils/formatters'

const CashierFinalSummary = ({ summary }) => {
  if (!summary) return null

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total de Vendas</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.resumo?.total_vendas || 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Descontos</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">-{formatCurrency(summary.resumo?.total_descontos || 0)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">Valor Líquido</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(summary.resumo?.total_liquido || 0)}</p>
        </div>
      </div>
    </div>
  )
}

export default CashierFinalSummary