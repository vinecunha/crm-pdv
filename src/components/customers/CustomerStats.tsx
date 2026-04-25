import React from 'react'
import { ShoppingCart, DollarSign, TrendingUp, Calendar } from '@lib/icons'
import { formatCurrency, formatDate } from '@utils/formatters'

const CustomerStats = ({ stats }) => {
  const StatCard = ({ icon: Icon, label, value, color }) => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
    }

    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{value}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        icon={ShoppingCart}
        label="Total de Compras"
        value={stats.totalPurchases || 0}
        color="blue"
      />
      <StatCard
        icon={DollarSign}
        label="Total Gasto"
        value={formatCurrency(stats.totalSpent || 0)}
        color="green"
      />
      <StatCard
        icon={TrendingUp}
        label="Ticket Médio"
        value={formatCurrency(stats.averageTicket || 0)}
        color="purple"
      />
      <StatCard
        icon={Calendar}
        label="Última Compra"
        value={stats.lastPurchase ? formatDate(stats.lastPurchase) : 'Nunca'}
        color="orange"
      />
    </div>
  )
}

export default CustomerStats
