import React from 'react'
import StatCard from '@components/ui/StatCard'
import { DollarSign, TrendingDown, XCircle, TrendingUp } from '@lib/icons'
import { formatCurrency, formatNumber } from '@utils/formatters'

const CashierSummaryCards = ({ summary }) => {
  if (!summary) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        label="Total de Vendas"
        value={formatCurrency(summary.resumo?.total_vendas || 0)}
        sublabel={`${formatNumber(summary.resumo?.total_itens || 0)} itens vendidos`}
        icon={DollarSign}
        variant="info"
      />
      <StatCard
        label="Descontos"
        value={formatCurrency(summary.resumo?.total_descontos || 0)}
        sublabel={`${((summary.resumo?.total_descontos / summary.resumo?.total_vendas) * 100 || 0).toFixed(1)}% do total`}
        icon={TrendingDown}
        variant="orange"
      />
      <StatCard
        label="Cancelamentos"
        value={formatCurrency(summary.resumo?.total_cancelamentos || 0)}
        sublabel="Vendas canceladas"
        icon={XCircle}
        variant="danger"
      />
      <StatCard
        label="Ticket Médio"
        value={formatCurrency(summary.resumo?.ticket_medio || 0)}
        sublabel={`${formatNumber(summary.resumo?.total_clientes || 0)} clientes atendidos`}
        icon={TrendingUp}
        variant="success"
      />
    </div>
  )
}

export default CashierSummaryCards