import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const SummaryCard = ({ title, value, icon: Icon, color, trend, subtitle, alert }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${alert ? 'border-red-300' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-2">
          {trend === 'up' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp size={12} /> Em alta
            </span>
          )}
          {trend === 'down' && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <TrendingDown size={12} /> Em baixa
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default SummaryCard