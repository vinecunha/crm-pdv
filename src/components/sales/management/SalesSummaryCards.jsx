import React from 'react'
import { FileText, DollarSign, Ticket, Ban } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const SalesSummaryCards = ({ summary }) => {
  const cards = [
    {
      title: 'Total de Vendas',
      value: summary.totalCount,
      subtitle: `${summary.completedCount} concluídas`,
      icon: FileText,
      color: 'blue',
      borderColor: 'border-blue-500 dark:border-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      valueColor: 'text-gray-900 dark:text-white'
    },
    {
      title: 'Faturamento Total',
      value: formatCurrency(summary.totalAmount),
      subtitle: `Em ${summary.completedCount} vendas`,
      icon: DollarSign,
      color: 'green',
      borderColor: 'border-green-500 dark:border-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
      valueColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Descontos Concedidos',
      value: formatCurrency(summary.totalDiscount),
      subtitle: `Média: ${formatCurrency(summary.totalDiscount / (summary.completedCount || 1))}`,
      icon: Ticket,
      color: 'purple',
      borderColor: 'border-purple-500 dark:border-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      valueColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Cancelamentos',
      value: summary.cancelledCount,
      subtitle: `${((summary.cancelledCount / summary.totalCount) * 100 || 0).toFixed(1)}% do total`,
      icon: Ban,
      color: 'red',
      borderColor: 'border-red-500 dark:border-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      textColor: 'text-red-600 dark:text-red-400',
      valueColor: 'text-red-600 dark:text-red-400'
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        return (
          <div 
            key={index} 
            className={`
              bg-white rounded-lg shadow-sm p-4 border-l-4 
              dark:bg-gray-900 dark:shadow-gray-900/50
              ${card.borderColor}
            `}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
                <p className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-1 dark:text-gray-500">{card.subtitle}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-full flex items-center justify-center`}>
                <Icon size={24} className={card.textColor} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SalesSummaryCards