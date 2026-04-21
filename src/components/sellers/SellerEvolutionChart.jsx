import React, { useMemo } from 'react'
import { TrendingUp, Calendar } from '../../lib/icons'
import { formatCurrency } from '../../utils/formatters'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'

const SellerEvolutionChart = ({ dailyPerformance }) => {
  const chartData = useMemo(() => {
    return dailyPerformance.map(day => ({
      ...day,
      date: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }))
  }, [dailyPerformance])
  
  const totalRevenue = dailyPerformance.reduce((sum, d) => sum + d.revenue, 0)
  const averageRevenue = totalRevenue / dailyPerformance.length
  const maxRevenue = Math.max(...dailyPerformance.map(d => d.revenue))
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{label}</p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Faturamento: <strong>{formatCurrency(payload[0].value)}</strong>
          </p>
          {payload[0].payload.count > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {payload[0].payload.count} {payload[0].payload.count === 1 ? 'venda' : 'vendas'}
            </p>
          )}
        </div>
      )
    }
    return null
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-green-500" />
          Evolução de Vendas (30 dias)
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Média:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(averageRevenue)}/dia
          </span>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#6b7280' }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={(value) => formatCurrency(value).replace('R$', '')}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Maior dia</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(maxRevenue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total (30d)</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Dias com venda</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {dailyPerformance.filter(d => d.revenue > 0).length}/30
          </p>
        </div>
      </div>
    </div>
  )
}

export default SellerEvolutionChart