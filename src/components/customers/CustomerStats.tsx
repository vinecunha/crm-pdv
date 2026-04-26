import React from 'react'
import { ShoppingCart, DollarSign, TrendingUp, Calendar } from '@lib/icons'
import { formatCurrency, formatDate } from '@utils/formatters'
import StatCard from '@components/ui/StatCard'

const CustomerStats = ({ stats }) => {

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
