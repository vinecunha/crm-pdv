import React from 'react'
import { DollarSign, TrendingDown, XCircle, TrendingUp } from 'lucide-react'
import { formatCurrency, formatNumber } from '../../utils/formatters'

const CashierSummaryCards = ({ summary }) => {
  if (!summary) return null

  const cards = [
    {
      title: 'Total de Vendas',
      value: formatCurrency(summary.resumo?.total_vendas || 0),
      icon: DollarSign,
      color: 'blue',
      subtitle: `${formatNumber(summary.resumo?.total_itens || 0)} itens vendidos`
    },
    {
      title: 'Descontos',
      value: formatCurrency(summary.resumo?.total_descontos || 0),
      icon: TrendingDown,
      color: 'orange',
      subtitle: `${((summary.resumo?.total_descontos / summary.resumo?.total_vendas) * 100 || 0).toFixed(1)}% do total`
    },
    {
      title: 'Cancelamentos',
      value: formatCurrency(summary.resumo?.total_cancelamentos || 0),
      icon: XCircle,
      color: 'red',
      subtitle: 'Vendas canceladas'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(summary.resumo?.ticket_medio || 0),
      icon: TrendingUp,
      color: 'green',
      subtitle: `${formatNumber(summary.resumo?.total_clientes || 0)} clientes atendidos`
    }
  ]

  const colorClasses = {
    blue: { border: 'border-blue-500', bg: 'bg-blue-50', icon: 'text-blue-600' },
    orange: { border: 'border-orange-500', bg: 'bg-orange-50', icon: 'text-orange-600' },
    red: { border: 'border-red-500', bg: 'bg-red-50', icon: 'text-red-600' },
    green: { border: 'border-green-500', bg: 'bg-green-50', icon: 'text-green-600' }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        const colors = colorClasses[card.color]
        return (
          <div key={index} className={`bg-white rounded-lg shadow-sm p-4 border-l-4 ${colors.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                {card.subtitle && <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>}
              </div>
              <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
                <Icon size={24} className={colors.icon} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default CashierSummaryCards