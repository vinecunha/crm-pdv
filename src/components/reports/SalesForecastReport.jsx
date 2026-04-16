// src/components/reports/SalesForecastReport.jsx
import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { Target, TrendingUp, TrendingDown, Calendar, DollarSign } from '../../lib/icons'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import DataTable from '../ui/DataTable'
import StatCard from '../ui/StatCard'

const fetchHistoricalData = async (monthsToFetch) => {
  const startDate = new Date()
  startDate.setMonth(startDate.getMonth() - monthsToFetch)
  startDate.setDate(1)
  startDate.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('sales')
    .select('final_amount, created_at')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
    .order('created_at')

  if (error) throw error
  return data
}

// Função de previsão usando média móvel simples
const calculateForecast = (historicalData, periodsToForecast = 3) => {
  // Agrupar por mês
  const monthlyData = {}
  
  historicalData.forEach(sale => {
    const date = new Date(sale.created_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { month: monthKey, total: 0, count: 0 }
    }
    monthlyData[monthKey].total += sale.final_amount || 0
    monthlyData[monthKey].count += 1
  })

  const sortedMonths = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
  
  // Últimos 3 meses para média
  const recentMonths = sortedMonths.slice(-3)
  const avgRevenue = recentMonths.reduce((sum, m) => sum + m.total, 0) / (recentMonths.length || 1)
  const avgSales = recentMonths.reduce((sum, m) => sum + m.count, 0) / (recentMonths.length || 1)
  
  // Tendência (crescimento/declínio)
  let trend = 0
  if (recentMonths.length >= 2) {
    const first = recentMonths[0].total
    const last = recentMonths[recentMonths.length - 1].total
    trend = first > 0 ? (last - first) / first : 0
  }

  // Previsão para próximos meses
  const forecast = []
  const lastMonth = sortedMonths[sortedMonths.length - 1]?.month || new Date().toISOString().slice(0, 7)
  const [year, month] = lastMonth.split('-').map(Number)
  
  for (let i = 1; i <= periodsToForecast; i++) {
    const forecastDate = new Date(year, month + i - 1, 1)
    const forecastMonth = forecastDate.toISOString().slice(0, 7)
    
    // Aplicar tendência
    const trendMultiplier = 1 + (trend * (i / 3))
    const forecastRevenue = avgRevenue * trendMultiplier
    const forecastSales = Math.round(avgSales * trendMultiplier)
    
    // Intervalo de confiança (±15%)
    const lowerBound = forecastRevenue * 0.85
    const upperBound = forecastRevenue * 1.15
    
    forecast.push({
      month: forecastMonth,
      revenue: forecastRevenue,
      sales: forecastSales,
      lowerBound,
      upperBound,
      confidence: trend === 0 ? 'Média' : trend > 0.1 ? 'Alta' : trend < -0.1 ? 'Baixa' : 'Média'
    })
  }

  return {
    historical: sortedMonths,
    forecast,
    avgRevenue,
    avgSales,
    trend,
    confidence: trend > 0.1 ? 'Crescimento' : trend < -0.1 ? 'Queda' : 'Estável'
  }
}

const SalesForecastReport = ({ dateRange, customDateRange }) => {
  const { data: historicalData, isLoading } = useQuery({
    queryKey: ['sales-forecast-historical'],
    queryFn: () => fetchHistoricalData(6) // Últimos 6 meses
  })

  const forecastData = useMemo(() => {
    if (!historicalData) return null
    return calculateForecast(historicalData, 3) // Prever 3 meses
  }, [historicalData])

  // Colunas para Previsão
  const forecastColumns = [
    {
      key: 'month',
      header: 'Mês',
      sortable: true,
      width: '25%',
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {new Date(row.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'revenue',
      header: 'Receita Prevista',
      sortable: true,
      width: '150px',
      render: (row) => <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</span>
    },
    {
      key: 'sales',
      header: 'Vendas Previstas',
      sortable: true,
      width: '150px',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatNumber(row.sales)}</span>
    },
    {
      key: 'interval',
      header: 'Intervalo (85-115%)',
      width: '200px',
      render: (row) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(row.lowerBound)} - {formatCurrency(row.upperBound)}
        </span>
      )
    },
    {
      key: 'confidence',
      header: 'Confiabilidade',
      width: '120px',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.confidence === 'Alta' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
          row.confidence === 'Média' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
        }`}>
          {row.confidence}
        </span>
      )
    }
  ]

  // Colunas para Histórico
  const historicalColumns = [
    {
      key: 'month',
      header: 'Mês',
      sortable: true,
      width: '40%',
      render: (row) => (
        <span className="font-medium text-gray-900 dark:text-white">
          {new Date(row.month + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </span>
      )
    },
    {
      key: 'total',
      header: 'Receita',
      sortable: true,
      width: '30%',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatCurrency(row.total)}</span>
    },
    {
      key: 'count',
      header: 'Vendas',
      sortable: true,
      width: '30%',
      render: (row) => <span className="text-gray-900 dark:text-white">{formatNumber(row.count)}</span>
    }
  ]

  if (isLoading) return <DataLoadingSkeleton type="cards" rows={5} />
  if (!forecastData) return null

  const { historical, forecast, avgRevenue, trend, confidence } = forecastData

  const nextMonthForecast = forecast[0] || { revenue: 0, sales: 0, lowerBound: 0, upperBound: 0 }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Previsão Próximo Mês"
          value={formatCurrency(nextMonthForecast.revenue)}
          sublabel={`${formatNumber(nextMonthForecast.sales)} vendas estimadas`}
          icon={Target}
          variant="info"
        />
        <StatCard
          label="Média Mensal (Últ. 3 meses)"
          value={formatCurrency(avgRevenue)}
          icon={TrendingUp}
          variant={trend >= 0 ? 'success' : 'warning'}
        />
        <StatCard
          label="Tendência"
          value={confidence}
          sublabel={`${trend >= 0 ? '+' : ''}${(trend * 100).toFixed(1)}% de variação`}
          icon={trend >= 0 ? TrendingUp : TrendingDown}
          variant={trend >= 0 ? 'success' : 'warning'}
        />
      </div>

      {/* Tabela de Previsão */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Previsão para os Próximos Meses</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Baseado no histórico dos últimos 6 meses</p>
        </div>
        <DataTable
          columns={forecastColumns}
          data={forecast}
          emptyMessage="Nenhuma previsão disponível"
          striped
          hover
          pagination={false}
          showActionsLegend={false}
        />
      </div>

      {/* Histórico */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Histórico (Últimos Meses)</h3>
        </div>
        <DataTable
          columns={historicalColumns}
          data={historical.slice(-6)}
          emptyMessage="Nenhum dado histórico"
          striped
          hover
          pagination={false}
          showActionsLegend={false}
        />
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          <strong>⚠️ Aviso:</strong> Esta é uma projeção baseada em dados históricos e pode não refletir a realidade.
          Fatores externos como sazonalidade, promoções e condições de mercado podem afetar os resultados.
        </p>
      </div>
    </div>
  )
}

export default SalesForecastReport