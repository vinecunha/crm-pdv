import React from 'react'
import StatCard from '@components/ui/StatCard'
import { FileText, DollarSign, Ticket, Ban } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const SalesSummaryCards = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total de Vendas"
        value={summary.totalCount}
        sublabel={`${summary.completedCount} concluídas`}
        icon={FileText}
        variant="info"
      />
      <StatCard
        label="Faturamento Total"
        value={formatCurrency(summary.totalAmount)}
        sublabel={`Em ${summary.completedCount} vendas`}
        icon={DollarSign}
        variant="success"
      />
      <StatCard
        label="Descontos Concedidos"
        value={formatCurrency(summary.totalDiscount)}
        sublabel={`Média: ${formatCurrency(summary.totalDiscount / (summary.completedCount || 1))}`}
        icon={Ticket}
        variant="purple"
      />
      <StatCard
        label="Cancelamentos"
        value={summary.cancelledCount}
        sublabel={`${((summary.cancelledCount / summary.totalCount) * 100 || 0).toFixed(1)}% do total`}
        icon={Ban}
        variant={summary.cancelledCount > 0 ? 'danger' : 'default'}
      />
    </div>
  )
}

export default SalesSummaryCards