// src/components/dashboard/PaymentMethodsChart.tsx
import React, { useMemo } from 'react'
import { Doughnut } from 'react-chartjs-2'
import { CreditCard, Wallet, Smartphone, Banknote } from '@lib/icons'
import '../../../lib/chartConfig'

interface PaymentMethodData {
  method: string
  total: number
  percentage: number
  count: number
}

interface PaymentMethodsChartProps {
  data: PaymentMethodData[]
  isLoading?: boolean
  title?: string
  height?: string
}

// Cores por método
const METHOD_COLORS: Record<string, string> = {
  'Dinheiro': '#10B981',          // green-500
  'Cartão de Crédito': '#3B82F6', // blue-500
  'Cartão de Débito': '#8B5CF6',  // purple-500
  'PIX': '#06B6D4',               // cyan-500
  'Fiado': '#F59E0B',             // amber-500
  'Outros': '#6B7280'             // gray-500
}

const METHOD_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'Dinheiro': Banknote,
  'Cartão de Crédito': CreditCard,
  'Cartão de Débito': CreditCard,
  'PIX': Smartphone,
  'Fiado': Wallet,
  'Outros': CreditCard
}

const PaymentMethodsChart: React.FC<PaymentMethodsChartProps> = ({
  data = [],
  isLoading = false,
  title = 'Formas de Pagamento',
  height = 'h-72'
}) => {
  const chartData = useMemo(() => ({
    labels: data.map(item => item.method),
    datasets: [{
      data: data.map(item => item.total),
      backgroundColor: data.map(item => METHOD_COLORS[item.method] || '#6B7280'),
      borderColor: '#fff',
      borderWidth: 3,
      hoverBorderWidth: 4,
      hoverBorderColor: '#fff',
    }]
  }), [data])

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '55%',
    plugins: {
      legend: {
        display: false // Legenda customizada abaixo
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
            const item = data[context.dataIndex]
            if (!item) return ''
            return [
              ` ${item.method}`,
              ` Total: R$ ${item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              ` Percentual: ${item.percentage.toFixed(1)}%`,
              ` Vendas: ${item.count}`
            ]
          }
        }
      }
    }
  }), [data])

  const totalAmount = useMemo(() => 
    data.reduce((sum, item) => sum + item.total, 0),
    [data]
  )

  const totalCount = useMemo(() => 
    data.reduce((sum, item) => sum + item.count, 0),
    [data]
  )

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm 
        border border-gray-100 dark:border-gray-700 p-3 sm:p-5 animate-pulse">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6" />
        <div className="flex items-center gap-6">
          <div className="w-40 h-40 bg-gray-100 dark:bg-gray-800 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm 
        border border-gray-100 dark:border-gray-700 p-3 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard size={18} className="text-blue-500" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
          <CreditCard size={48} className="mb-3 opacity-50" />
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
          <CreditCard size={18} className="text-blue-500" />
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Total: R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>

      {/* Gráfico + Legenda */}
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        {/* Donut */}
        <div className={`w-48 ${height} relative flex-shrink-0 mx-auto sm:mx-0`}>
          <Doughnut data={chartData} options={options} />
          
          {/* Centro do donut */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {totalCount}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                vendas
              </p>
            </div>
          </div>
        </div>

        {/* Legenda customizada */}
        <div className="flex-1 w-full space-y-2">
          {data.map((item, index) => {
            const IconComponent = METHOD_ICONS[item.method] || CreditCard
            const color = METHOD_COLORS[item.method] || '#6B7280'
            
            return (
              <div 
                key={item.method} 
                className="flex items-center justify-between p-2 rounded-lg 
                  hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <IconComponent size={14} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {item.method}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.count}x
                  </span>
                  <div className="w-16 text-right">
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-1">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: color 
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PaymentMethodsChart