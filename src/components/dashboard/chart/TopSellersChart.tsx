// src/components/dashboard/TopSellersChart.tsx
import React, { useMemo } from 'react'
import { Bar } from 'react-chartjs-2'
import { Users, Trophy, TrendingUp } from '@lib/icons'
import '../../../lib/chartConfig'

interface SellerData {
  id: string
  name: string
  total: number
  count: number
  average: number
  avatar?: string
}

interface TopSellersChartProps {
  data: SellerData[]
  isLoading?: boolean
  totalTeamSales?: number
  title?: string
  height?: string
}

// Cores para ranking
const RANKING_COLORS = [
  '#F59E0B', // 🥇 Ouro
  '#94A3B8', // 🥈 Prata
  '#CD7F32', // 🥉 Bronze
  '#3B82F6', // 4º Azul
  '#10B981', // 5º Verde
]

const RANKING_EMOJIS = ['🥇', '🥈', '🥉', '4º', '5º']

const TopSellersChart: React.FC<TopSellersChartProps> = ({
  data = [],
  isLoading = false,
  totalTeamSales = 0,
  title = 'Top Vendedores',
  height = 'h-80 sm:h-96'
}) => {
  const chartData = useMemo(() => ({
    labels: data.map(item => item.name.split(' ')[0]),
    datasets: [{
      label: 'Total Vendido',
      data: data.map(item => item.total),
      backgroundColor: data.map((_, i) => RANKING_COLORS[i] || '#6B7280'),
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 36,
    }]
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1F2937' : '#fff',
        titleColor: document.documentElement.classList.contains('dark') ? '#F9FAFB' : '#111827',
        bodyColor: document.documentElement.classList.contains('dark') ? '#D1D5DB' : '#374151',
        borderColor: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          title: (items: any[]) => {
            const index = items[0]?.dataIndex
            return data[index]?.name || ''
          },
          label: (context: any) => {
            const item = data[context.dataIndex]
            return [
              ` 💰 Total: R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              ` 📦 Vendas: ${item.count}`,
              ` 📊 Média: R$ ${item.average.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              totalTeamSales > 0 
                ? ` 📈 Representa: ${((item.total / totalTeamSales) * 100).toFixed(1)}% da equipe`
                : ''
            ]
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => {
            if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`
            return `R$ ${value}`
          },
          font: { size: 11 }
        },
        grid: {
          color: document.documentElement.classList.contains('dark') 
            ? 'rgba(75, 85, 99, 0.15)' 
            : 'rgba(156, 163, 175, 0.15)'
        }
      },
      y: {
        ticks: {
          font: { size: 11 }
        },
        grid: { display: false }
      }
    }
  }), [data, totalTeamSales])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm 
        border border-gray-100 dark:border-gray-700 p-3 sm:p-5 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm 
        border border-gray-100 dark:border-gray-700 p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-blue-500" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
          <Trophy size={48} className="mb-3 opacity-50" />
          <p className="text-sm">Nenhum dado disponível</p>
          <p className="text-xs mt-1">Os dados aparecerão conforme as vendas ocorrerem</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm 
      border border-gray-100 dark:border-gray-700 p-3 sm:p-5">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-yellow-500" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Total: {formatCurrency(totalTeamSales)}
        </span>
      </div>

      {/* Gráfico de Barras Horizontais */}
      <div className={height}>
        <Bar data={chartData} options={options} />
      </div>

      {/* Cards dos Top 3 */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {data.slice(0, 3).map((seller, index) => (
          <div 
            key={seller.id}
            className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
          >
            <div className="text-2xl mb-1">{RANKING_EMOJIS[index]}</div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
              {seller.name.split(' ')[0]}
            </p>
            <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
              {formatCurrency(seller.total)}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">
              {seller.count} vendas
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TopSellersChart