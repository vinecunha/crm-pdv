// src/components/dashboard/RevenueCostChart.tsx
import React, { useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { TrendingUp, TrendingDown, DollarSign } from '@lib/icons'
import '../../../lib/chartConfig'

// Tipos
interface RevenueCostData {
  month: string
  revenue: number
  cost: number
  profit: number
}

interface RevenueCostChartProps {
  data: RevenueCostData[]
  isLoading?: boolean
  title?: string
  period?: string
  height?: string
}

const RevenueCostChart: React.FC<RevenueCostChartProps> = ({
  data = [],
  isLoading = false,
  title = 'Receitas vs Custos',
  period = 'Últimos 6 meses',
  height = 'h-64 sm:h-72'
}) => {
  // Cores do tema
  const revenueColor = '#10B981' // green-500
  const costColor = '#EF4444'    // red-500
  const profitColor = '#3B82F6'  // blue-500

  // Calcular totais
  const totals = useMemo(() => {
    const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0)
    const totalCost = data.reduce((sum, item) => sum + (item.cost || 0), 0)
    const totalProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    
    return { totalRevenue, totalCost, totalProfit, profitMargin }
  }, [data])

  // Dados do gráfico
  const chartData = useMemo(() => ({
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Receita',
        data: data.map(item => item.revenue),
        borderColor: revenueColor,
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointBackgroundColor: revenueColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
      },
      {
        label: 'Custos',
        data: data.map(item => item.cost),
        borderColor: costColor,
        backgroundColor: 'transparent',
        borderWidth: 2.5,
        pointBackgroundColor: costColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
      },
      {
        label: 'Lucro',
        data: data.map(item => item.profit),
        borderColor: profitColor,
        backgroundColor: profitColor + '15',
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: profitColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        fill: true,
      }
    ]
  }), [data])

  // Opções do gráfico
  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 25,
          font: {
            size: 12,
            weight: '500' as const
          },
          color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280'
        }
      },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#fff',
        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const value = context.raw || 0
            return ` ${context.dataset.label}: R$ ${value.toLocaleString('pt-BR', { 
              minimumFractionDigits: 2,
              maximumFractionDigits: 2 
            })}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => {
            if (value >= 1000) {
              return `R$ ${(value / 1000).toFixed(0)}k`
            }
            return `R$ ${value}`
          },
          font: {
            size: 11
          }
        },
        grid: {
          color: document.documentElement.classList.contains('dark') 
            ? 'rgba(75, 85, 99, 0.15)' 
            : 'rgba(156, 163, 175, 0.15)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  }), [])

  // Formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm 
        border border-gray-100 dark:border-gray-700 p-3 sm:p-6 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
        
        {/* Cards skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
        
        {/* Chart skeleton */}
        <div className={`${height} bg-gray-100 dark:bg-gray-800 rounded-lg`} />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm 
        border border-gray-100 dark:border-gray-700 p-3 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={18} className="text-green-500" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
          <DollarSign size={48} className="mb-3 opacity-50" />
          <p className="text-sm">Nenhum dado disponível</p>
          <p className="text-xs mt-1">Os dados aparecerão aqui conforme as vendas ocorrerem</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm 
      border border-gray-100 dark:border-gray-700 p-3 sm:p-6">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign size={18} className="text-green-500" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {period}
          </p>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 sm:mb-6">
        {/* Receita Total */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-green-600 dark:text-green-400" />
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Receita
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-green-700 dark:text-green-300">
            {formatCurrency(totals.totalRevenue)}
          </p>
        </div>

        {/* Custos Totais */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={14} className="text-red-600 dark:text-red-400" />
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">
              Custos
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-red-700 dark:text-red-300">
            {formatCurrency(totals.totalCost)}
          </p>
        </div>

        {/* Lucro Total */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign size={14} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Lucro
            </span>
          </div>
          <p className={`text-sm sm:text-base font-bold ${
            totals.totalProfit >= 0 
              ? 'text-blue-700 dark:text-blue-300' 
              : 'text-red-700 dark:text-red-300'
          }`}>
            {formatCurrency(totals.totalProfit)}
          </p>
        </div>

        {/* Margem */}
        <div className={`rounded-lg p-3 ${
          totals.profitMargin >= 0 
            ? 'bg-purple-50 dark:bg-purple-900/20' 
            : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={14} className="text-purple-600 dark:text-purple-400" />
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
              Margem
            </span>
          </div>
          <p className="text-sm sm:text-base font-bold text-purple-700 dark:text-purple-300">
            {totals.profitMargin.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Gráfico */}
      <div className={height}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}

export default RevenueCostChart