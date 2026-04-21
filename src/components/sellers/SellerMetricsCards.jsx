import React from 'react'
import { Target, DollarSign, CreditCard, Users, TrendingUp, ShoppingBag } from '../../lib/icons'
import { formatCurrency } from '../../utils/formatters'

const MetricCard = ({ title, value, icon: Icon, color, trend, trendValue }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    pink: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
  }
  
  // ✅ Formatar valor baseado no tipo
  const formatValue = (val) => {
    if (val === null || val === undefined) return '0'
    
    // Se for número decimal, arredondar
    if (typeof val === 'number') {
      // Para valores monetários ou tickets
      if (title.toLowerCase().includes('r$') || title.toLowerCase().includes('ticket') || title.toLowerCase().includes('faturamento')) {
        return formatCurrency(val)
      }
      // Para contagens (vendas, clientes)
      if (title.toLowerCase().includes('vendas') || title.toLowerCase().includes('clientes')) {
        return Math.round(val).toLocaleString('pt-BR')
      }
      // Para outros números, limitar a 2 casas decimais
      return Math.round(val * 100) / 100
    }
    
    return val
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {formatValue(value)}
          </p>
          {trend !== undefined && trend !== null && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${
              trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}>
              <TrendingUp size={12} className={trend < 0 ? 'rotate-180' : ''} />
              {Math.abs(trend).toFixed(1)}% {trendValue || 'vs período anterior'}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  )
}

const SellerMetricsCards = ({ metrics, customersCount }) => {
  // ✅ Arredondar valores antes de passar para os cards
  const roundedMetrics = {
    ...metrics,
    totalSales: Math.round(metrics.totalSales || 0),
    totalRevenue: Math.round((metrics.totalRevenue || 0) * 100) / 100,
    averageTicket: Math.round((metrics.averageTicket || 0) * 100) / 100,
    salesLast30Days: Math.round(metrics.salesLast30Days || 0),
    revenueLast30Days: Math.round((metrics.revenueLast30Days || 0) * 100) / 100,
    revenueTrend: metrics.revenueTrend ? Math.round(metrics.revenueTrend * 10) / 10 : undefined,
    ticketTrend: metrics.ticketTrend ? Math.round(metrics.ticketTrend * 10) / 10 : undefined,
    revenueMonthTrend: metrics.revenueMonthTrend ? Math.round(metrics.revenueMonthTrend * 10) / 10 : undefined
  }
  
  const cards = [
    {
      title: 'Total de Vendas',
      value: roundedMetrics.totalSales,
      icon: Target,
      color: 'blue'
    },
    {
      title: 'Faturamento Total',
      value: roundedMetrics.totalRevenue,
      icon: DollarSign,
      color: 'green',
      trend: roundedMetrics.revenueTrend
    },
    {
      title: 'Ticket Médio',
      value: roundedMetrics.averageTicket,
      icon: CreditCard,
      color: 'purple',
      trend: roundedMetrics.ticketTrend
    },
    {
      title: 'Clientes Atendidos',
      value: customersCount,
      icon: Users,
      color: 'orange'
    },
    {
      title: 'Vendas (30 dias)',
      value: roundedMetrics.salesLast30Days,
      icon: ShoppingBag,
      color: 'pink'
    },
    {
      title: 'Faturamento (30 dias)',
      value: roundedMetrics.revenueLast30Days,
      icon: DollarSign,
      color: 'indigo',
      trend: roundedMetrics.revenueMonthTrend
    }
  ]
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {cards.map((card, index) => (
        <MetricCard key={index} {...card} />
      ))}
    </div>
  )
}

export default SellerMetricsCards