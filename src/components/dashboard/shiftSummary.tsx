// src/components/dashboard/ShiftSummary.jsx
import React from 'react'
import { Clock, DollarSign, ShoppingBag } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const ShiftSummary = ({ sales }) => {
  const today = new Date()
  const todayStr = today.toDateString()
  
  const todaySales = sales?.filter(s => 
    new Date(s.created_at).toDateString() === todayStr
  ) || []
  
  const totalToday = todaySales.reduce((sum, s) => sum + s.final_amount, 0)
  const countToday = todaySales.length
  
  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={18} className="text-green-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Resumo do Turno
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Vendas hoje</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {countToday}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total vendido</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalToday)}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ShiftSummary
