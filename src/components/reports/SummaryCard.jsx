import React from 'react'
import { TrendingUp, TrendingDown } from '../../lib/icons'

const SummaryCard = ({ title, value, icon: Icon, color, trend, subtitle, alert }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
  }

  return (
    <div className={`bg-white rounded-lg border p-6 dark:bg-gray-800 dark:border-gray-700 ${alert ? 'border-red-300 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold mt-1 dark:text-white">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1 dark:text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-2">
          {trend === 'up' && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <TrendingUp size={12} /> Em alta
            </span>
          )}
          {trend === 'down' && (
            <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
              <TrendingDown size={12} /> Em baixa
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default SummaryCard