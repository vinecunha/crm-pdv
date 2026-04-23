import React, { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import { Activity, Calendar, TrendingUp, Sun, Snowflake } from '@lib/icons'
import { formatCurrency, formatNumber } from '@utils/formatters'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import StatCard from '@components/ui/StatCard'

const fetchYearlyData = async () => {
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1)
  startDate.setMonth(0)
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

const SeasonalityReport = ({ dateRange, customDateRange }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['seasonality-data'],
    queryFn: fetchYearlyData
  })

  const seasonalityData = useMemo(() => {
    if (!data) return null

    // Agrupar por mês e dia da semana
    const byMonth = Array(12).fill(null).map(() => ({ total: 0, count: 0 }))
    const byWeekday = Array(7).fill(null).map(() => ({ total: 0, count: 0 }))
    const byQuarter = Array(4).fill(null).map(() => ({ total: 0, count: 0 }))

    data.forEach(sale => {
      const date = new Date(sale.created_at)
      const month = date.getMonth()
      const weekday = date.getDay()
      const quarter = Math.floor(month / 3)

      byMonth[month].total += sale.final_amount || 0
      byMonth[month].count += 1

      byWeekday[weekday].total += sale.final_amount || 0
      byWeekday[weekday].count += 1

      byQuarter[quarter].total += sale.final_amount || 0
      byQuarter[quarter].count += 1
    })

    // Calcular médias
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
    const quarterNames = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre']

    const overallAvg = byMonth.reduce((sum, m) => sum + m.total, 0) / 12

    const monthlyData = byMonth.map((m, i) => ({
      name: monthNames[i],
      total: m.total,
      count: m.count,
      avg: m.count > 0 ? m.total / m.count : 0,
      index: (m.total / overallAvg) * 100
    }))

    const weekdayData = byWeekday.map((w, i) => ({
      name: weekdayNames[i],
      total: w.total,
      count: w.count,
      avg: w.count > 0 ? w.total / w.count : 0
    }))

    const quarterData = byQuarter.map((q, i) => ({
      name: quarterNames[i],
      total: q.total,
      count: q.count,
      avg: q.count > 0 ? q.total / q.count : 0
    }))

    // Identificar melhores e piores períodos
    const bestMonth = monthlyData.reduce((best, m) => m.total > best.total ? m : best, monthlyData[0])
    const worstMonth = monthlyData.reduce((worst, m) => m.total < worst.total ? m : worst, monthlyData[0])
    const bestWeekday = weekdayData.reduce((best, w) => w.total > best.total ? w : best, weekdayData[0])
    const worstWeekday = weekdayData.reduce((worst, w) => w.total < worst.total ? w : worst, weekdayData[0])

    return {
      monthlyData,
      weekdayData,
      quarterData,
      bestMonth,
      worstMonth,
      bestWeekday,
      worstWeekday,
      overallAvg
    }
  }, [data])

  if (isLoading) return <DataLoadingSkeleton type="cards" rows={5} />
  if (!seasonalityData) return null

  const { monthlyData, weekdayData, quarterData, bestMonth, worstMonth, bestWeekday, worstWeekday } = seasonalityData

  // Encontrar valor máximo para escala
  const maxMonthlyValue = Math.max(...monthlyData.map(m => m.total))

  return (
    <div className="space-y-6">
      {/* Cards de Destaque */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Melhor Mês"
          value={bestMonth.name}
          sublabel={formatCurrency(bestMonth.total)}
          icon={Sun}
          variant="success"
        />
        <StatCard
          label="Pior Mês"
          value={worstMonth.name}
          sublabel={formatCurrency(worstMonth.total)}
          icon={Snowflake}
          variant="warning"
        />
        <StatCard
          label="Melhor Dia"
          value={bestWeekday.name}
          sublabel={formatCurrency(bestWeekday.total)}
          icon={TrendingUp}
          variant="success"
        />
        <StatCard
          label="Pior Dia"
          value={worstWeekday.name}
          sublabel={formatCurrency(worstWeekday.total)}
          icon={Activity}
          variant="danger"
        />
      </div>

      {/* Sazonalidade Mensal */}
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Sazonalidade Mensal</h3>
        
        {/* Gráfico de barras simplificado */}
        <div className="space-y-2">
          {monthlyData.map((month, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="w-10 text-sm font-medium text-gray-700 dark:text-gray-300">{month.name}</span>
              <div className="flex-1">
                <div className="relative h-8">
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-r transition-all ${
                      month.index > 110 ? 'bg-green-500 dark:bg-green-600' : 
                      month.index < 90 ? 'bg-red-500 dark:bg-red-600' : 
                      'bg-blue-500 dark:bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, (month.total / maxMonthlyValue) * 100)}%` }}
                  >
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">
                      {formatCurrency(month.total)}
                    </span>
                  </div>
                </div>
              </div>
              <span className="w-16 text-right text-sm">
                <span className={
                  month.index > 110 ? 'text-green-600 dark:text-green-400' : 
                  month.index < 90 ? 'text-red-600 dark:text-red-400' : 
                  'text-gray-600 dark:text-gray-400'
                }>
                  {month.index.toFixed(0)}%
                </span>
              </span>
            </div>
          ))}
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Índice: 100% = média mensal. Acima de 110% = alta temporada, abaixo de 90% = baixa temporada.
        </p>
      </div>

      {/* Por Trimestre e Dia da Semana */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trimestres */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Por Trimestre</h3>
          <div className="space-y-3">
            {quarterData.map((quarter, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{quarter.name}</span>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(quarter.total)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(quarter.count)} vendas</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dias da Semana */}
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Por Dia da Semana</h3>
          <div className="space-y-3">
            {weekdayData.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">{day.name}</span>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(day.total)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatNumber(day.count)} vendas</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recomendações */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>📊 Recomendações baseadas na sazonalidade:</strong>
          <br />
          • <strong>Alta temporada ({bestMonth.name}):</strong> Reforce o estoque e considere campanhas de marketing.
          <br />
          • <strong>Baixa temporada ({worstMonth.name}):</strong> Planeje promoções para estimular vendas.
          <br />
          • <strong>Melhor dia ({bestWeekday.name}):</strong> Foque em ações promocionais neste dia.
          <br />
          • <strong>Pior dia ({worstWeekday.name}):</strong> Avalie horário de funcionamento ou ofertas especiais.
        </p>
      </div>
    </div>
  )
}

export default SeasonalityReport
