import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { Calendar, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users } from '@lib/icons'
import { formatCurrency, formatNumber } from '@utils/formatters'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import StatCard from '@components/ui/StatCard'

const fetchPeriodData = async (currentStart, currentEnd, previousStart, previousEnd) => {
  const [currentRes, previousRes] = await Promise.all([
    supabase.from('sales')
      .select('final_amount, total_amount, discount_amount, created_at, customer_id')
      .gte('created_at', currentStart)
      .lte('created_at', currentEnd)
      .eq('status', 'completed'),
    supabase.from('sales')
      .select('final_amount, total_amount, discount_amount, created_at, customer_id')
      .gte('created_at', previousStart)
      .lte('created_at', previousEnd)
      .eq('status', 'completed')
  ])

  return {
    current: currentRes.data || [],
    previous: previousRes.data || []
  }
}

const PeriodComparisonReport = ({ dateRange, customDateRange }) => {
  // Período atual
  const currentStart = customDateRange?.start || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0]
  const currentEnd = customDateRange?.end || new Date().toISOString().split('T')[0]
  
  // Período anterior (mesma duração)
  const currentStartDate = new Date(currentStart)
  const currentEndDate = new Date(currentEnd)
  const duration = currentEndDate - currentStartDate
  
  const previousEnd = new Date(currentStartDate.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - duration)

  const { data, isLoading } = useQuery({
    queryKey: ['period-comparison', currentStart, currentEnd],
    queryFn: () => fetchPeriodData(
      currentStart, currentEnd,
      previousStart.toISOString().split('T')[0],
      previousEnd.toISOString().split('T')[0]
    )
  })

  const comparisonData = useMemo(() => {
    if (!data) return null

    const calcMetrics = (sales) => {
      const totalSales = sales.length
      const totalRevenue = sales.reduce((sum, s) => sum + (s.final_amount || 0), 0)
      const totalDiscount = sales.reduce((sum, s) => sum + (s.discount_amount || 0), 0)
      const avgTicket = totalSales > 0 ? totalRevenue / totalSales : 0
      const uniqueCustomers = new Set(sales.map(s => s.customer_id).filter(Boolean)).size

      return { totalSales, totalRevenue, totalDiscount, avgTicket, uniqueCustomers }
    }

    const current = calcMetrics(data.current)
    const previous = calcMetrics(data.previous)

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0
      return ((curr - prev) / prev) * 100
    }

    return {
      current,
      previous,
      changes: {
        sales: calcChange(current.totalSales, previous.totalSales),
        revenue: calcChange(current.totalRevenue, previous.totalRevenue),
        discount: calcChange(current.totalDiscount, previous.totalDiscount),
        avgTicket: calcChange(current.avgTicket, previous.avgTicket),
        customers: calcChange(current.uniqueCustomers, previous.uniqueCustomers)
      }
    }
  }, [data])

  if (isLoading) return <DataLoadingSkeleton type="cards" rows={5} />
  if (!comparisonData) return null

  const { current, previous, changes } = comparisonData

  const formatPeriod = (start, end) => {
    const s = new Date(start)
    const e = new Date(end)
    return `${s.toLocaleDateString('pt-BR')} - ${e.toLocaleDateString('pt-BR')}`
  }

  return (
    <div className="space-y-6">
      {/* Períodos */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Período Atual</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatPeriod(currentStart, currentEnd)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Período Anterior</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {formatPeriod(previousStart.toISOString().split('T')[0], previousEnd.toISOString().split('T')[0])}
            </p>
          </div>
        </div>
      </div>

      {/* Cards Comparativos */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <ComparisonCard
          label="Vendas"
          current={formatNumber(current.totalSales)}
          previous={formatNumber(previous.totalSales)}
          change={changes.sales}
          icon={ShoppingCart}
        />
        <ComparisonCard
          label="Receita"
          current={formatCurrency(current.totalRevenue)}
          previous={formatCurrency(previous.totalRevenue)}
          change={changes.revenue}
          icon={DollarSign}
        />
        <ComparisonCard
          label="Ticket Médio"
          current={formatCurrency(current.avgTicket)}
          previous={formatCurrency(previous.avgTicket)}
          change={changes.avgTicket}
          icon={TrendingUp}
        />
        <ComparisonCard
          label="Descontos"
          current={formatCurrency(current.totalDiscount)}
          previous={formatCurrency(previous.totalDiscount)}
          change={changes.discount}
          icon={TrendingDown}
          inverseColors
        />
        <ComparisonCard
          label="Clientes Únicos"
          current={formatNumber(current.uniqueCustomers)}
          previous={formatNumber(previous.uniqueCustomers)}
          change={changes.customers}
          icon={Users}
        />
      </div>

      {/* Resumo */}
      <div className={`rounded-lg p-4 ${
        changes.revenue >= 0 
          ? 'bg-green-50 dark:bg-green-900/20' 
          : 'bg-red-50 dark:bg-red-900/20'
      }`}>
        <p className="text-sm text-gray-900 dark:text-white">
          <strong>📊 Resumo do Período:</strong>
          <br />
          {changes.revenue >= 0 ? (
            <>✅ A receita aumentou {changes.revenue.toFixed(1)}% em relação ao período anterior.</>
          ) : (
            <>⚠️ A receita diminuiu {Math.abs(changes.revenue).toFixed(1)}% em relação ao período anterior.</>
          )}
          <br />
          {changes.sales >= 0 ? (
            <>📈 O número de vendas cresceu {changes.sales.toFixed(1)}%.</>
          ) : (
            <>📉 O número de vendas caiu {Math.abs(changes.sales).toFixed(1)}%.</>
          )}
          <br />
          {changes.avgTicket >= 0 ? (
            <>💰 O ticket médio aumentou {changes.avgTicket.toFixed(1)}%.</>
          ) : (
            <>💵 O ticket médio diminuiu {Math.abs(changes.avgTicket).toFixed(1)}%.</>
          )}
        </p>
      </div>
    </div>
  )
}

// Componente Card Comparativo
const ComparisonCard = ({ label, current, previous, change, icon: Icon, inverseColors }) => {
  const isPositive = inverseColors ? change <= 0 : change >= 0
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <Icon size={18} className="text-gray-400 dark:text-gray-500" />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{current}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className={`text-xs ${
          isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        } flex items-center gap-0.5`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">vs {previous}</span>
      </div>
    </div>
  )
}

export default PeriodComparisonReport
