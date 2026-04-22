// src/components/sellers/SellerEvolutionChart.jsx
import React, { useMemo, useRef, useEffect } from 'react'
import { TrendingUp } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Title,
  Tooltip,
  Legend
)

const SellerEvolutionChart = ({ dailyPerformance }) => {
  const chartRef = useRef(null)
  
  const chartData = useMemo(() => {
    return dailyPerformance.map(day => ({
      date: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      revenue: day.revenue,
      count: day.count
    }))
  }, [dailyPerformance])
  
  const totalRevenue = dailyPerformance.reduce((sum, d) => sum + d.revenue, 0)
  const averageRevenue = totalRevenue / dailyPerformance.length
  const maxRevenue = Math.max(...dailyPerformance.map(d => d.revenue))
  const daysWithSales = dailyPerformance.filter(d => d.revenue > 0).length
  
  const data = {
    labels: chartData.map(d => d.date),
    datasets: [
      {
        label: 'Faturamento',
        data: chartData.map(d => d.revenue),
        borderColor: '#3b82f6',
        backgroundColor: (context) => {
          const ctx = context.chart?.ctx
          if (!ctx) return 'rgba(59, 130, 246, 0.1)'
          
          const gradient = ctx.createLinearGradient(0, 0, 0, 400)
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)')
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
          return gradient
        },
        borderWidth: 2,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true
      }
    ]
  }
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#f3f4f6',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: (items) => items[0]?.label || '',
          label: (context) => {
            const value = context.raw
            const index = context.dataIndex
            const count = chartData[index]?.count || 0
            return [
              `Faturamento: ${formatCurrency(value)}`,
              `${count} ${count === 1 ? 'venda' : 'vendas'}`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 },
          color: '#6b7280',
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: {
          color: (context) => {
            return context.tick.value === 0 
              ? '#374151' 
              : 'rgba(75, 85, 99, 0.3)'
          }
        },
        ticks: {
          font: { size: 11 },
          color: '#6b7280',
          callback: (value) => formatCurrency(value).replace('R$', '')
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  }
  
  // Cleanup do chart ao desmontar
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [])
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp size={20} className="text-green-500" />
          Evolução de Vendas (30 dias)
        </h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Média:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(averageRevenue)}/dia
          </span>
        </div>
      </div>
      
      <div className="h-64">
        <Line ref={chartRef} data={data} options={options} />
      </div>
      
      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Maior dia</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(maxRevenue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total (30d)</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Dias com venda</p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {daysWithSales}/30
          </p>
        </div>
      </div>
    </div>
  )
}

export default SellerEvolutionChart