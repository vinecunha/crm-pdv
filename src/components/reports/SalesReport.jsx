import React, { useState, useEffect, useRef } from 'react'
import {
  ShoppingCart, DollarSign, TrendingUp, Percent,
  CreditCard
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters'
import SummaryCard from './SummaryCard'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import Badge from '../Badge'
import { Line, Doughnut } from 'react-chartjs-2'
import '../../lib/chartConfig' // Importar configuração

const SalesReport = ({ dateRange, customDateRange, paymentMethodFilter }) => {
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  
  // IDs únicos para os canvas (evita conflito)
  const lineChartId = useRef(`line-chart-${Date.now()}-${Math.random().toString(36)}`)
  const doughnutChartId = useRef(`doughnut-chart-${Date.now()}-${Math.random().toString(36)}`)

  useEffect(() => {
    loadSalesReport()
  }, [dateRange, customDateRange, paymentMethodFilter])

  const getDateRange = () => {
    const now = new Date()
    let startDate, endDate
    
    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0))
        endDate = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        endDate = new Date()
        break
      case 'month':
        startDate = new Date(now.setDate(now.getDate() - 30))
        endDate = new Date()
        break
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        endDate = new Date()
        break
      case 'custom':
        startDate = new Date(customDateRange.start)
        endDate = new Date(customDateRange.end)
        endDate.setHours(23, 59, 59, 999)
        break
      default:
        startDate = new Date(now.setDate(now.getDate() - 30))
        endDate = new Date()
    }
    
    return { startDate, endDate }
  }

  const loadSalesReport = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()

      let query = supabase
        .from('sales')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })
      
      if (paymentMethodFilter) {
        query = query.eq('payment_method', paymentMethodFilter)
      }
      
      const { data: sales, error } = await query
      if (error) throw error
      
      const totalSales = sales?.length || 0
      const totalRevenue = sales?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
      const totalDiscount = sales?.reduce((sum, s) => sum + (s.discount_amount || 0), 0) || 0
      
      const salesByDay = {}
      const revenueByDay = {}
      
      sales?.forEach(sale => {
        const day = new Date(sale.created_at).toLocaleDateString('pt-BR')
        salesByDay[day] = (salesByDay[day] || 0) + 1
        revenueByDay[day] = (revenueByDay[day] || 0) + (sale.final_amount || 0)
      })
      
      const salesByPayment = {}
      sales?.forEach(sale => {
        const method = sale.payment_method || 'outros'
        salesByPayment[method] = (salesByPayment[method] || 0) + (sale.final_amount || 0)
      })
      
      setRecentSales(sales?.slice(0, 10) || [])
      
      setSalesData({
        totalSales,
        totalRevenue,
        averageTicket,
        totalDiscount,
        salesByDay: Object.entries(salesByDay).map(([date, count]) => ({ date, count })),
        revenueByDay: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
        salesByPayment: Object.entries(salesByPayment).map(([method, amount]) => ({ method, amount }))
      })

    } catch (error) {
      console.error('Erro ao carregar relatório de vendas:', error)
    } finally {
      setLoading(false)
    }
  }

  const salesChartData = {
    labels: salesData?.revenueByDay?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Faturamento (R$)',
        data: salesData?.revenueByDay?.map(d => d.amount) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  }

  const paymentMethodsChartData = {
    labels: salesData?.salesByPayment?.map(d => {
      const methods = {
        cash: 'Dinheiro',
        credit: 'Crédito',
        debit: 'Débito',
        pix: 'PIX'
      }
      return methods[d.method] || d.method
    }) || [],
    datasets: [
      {
        data: salesData?.salesByPayment?.map(d => d.amount) || [],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(107, 114, 128, 0.8)'
        ],
        borderWidth: 0
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let value = context.raw
            return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `R$ ${value}`
        }
      }
    }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.raw
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return `R$ ${value.toLocaleString('pt-BR')} (${percentage}%)`
          }
        }
      }
    }
  }

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={4} />
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total de Vendas"
          value={formatNumber(salesData?.totalSales || 0)}
          icon={ShoppingCart}
          color="blue"
          subtitle="Período selecionado"
        />
        <SummaryCard
          title="Faturamento Total"
          value={formatCurrency(salesData?.totalRevenue || 0)}
          icon={DollarSign}
          color="green"
          trend={salesData?.totalRevenue > 1000 ? 'up' : 'stable'}
        />
        <SummaryCard
          title="Ticket Médio"
          value={formatCurrency(salesData?.averageTicket || 0)}
          icon={TrendingUp}
          color="purple"
        />
        <SummaryCard
          title="Total de Descontos"
          value={formatCurrency(salesData?.totalDiscount || 0)}
          icon={Percent}
          color="orange"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Faturamento no Período</h3>
          <div className="h-64" key={lineChartId.current}>
            <Line 
              data={salesChartData} 
              options={chartOptions} 
              redraw={false}
            />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Vendas por Forma de Pagamento</h3>
          <div className="h-64" key={doughnutChartId.current}>
            {salesData?.salesByPayment?.length > 0 ? (
              <Doughnut 
                data={paymentMethodsChartData} 
                options={doughnutOptions}
                redraw={false}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Últimas Vendas */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Últimas Vendas</h3>
        </div>
        
        {recentSales.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma venda no período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Nº Venda</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Pagamento</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentSales.map(sale => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-mono">{sale.sale_number}</td>
                    <td className="px-6 py-4 text-sm">
                      {sale.customer_name || 'Cliente não identificado'}
                    </td>
                    <td className="px-6 py-4 text-sm">{formatDateTime(sale.created_at)}</td>
                    <td className="px-6 py-4 text-sm">
                      <Badge variant={
                        sale.payment_method === 'cash' ? 'success' :
                        sale.payment_method === 'credit' ? 'info' :
                        sale.payment_method === 'debit' ? 'warning' : 'default'
                      }>
                        {sale.payment_method === 'cash' ? 'Dinheiro' :
                         sale.payment_method === 'credit' ? 'Crédito' :
                         sale.payment_method === 'debit' ? 'Débito' : 'PIX'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                      {formatCurrency(sale.final_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumo Rápido */}
      {salesData && salesData.totalSales > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CreditCard size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-blue-800">
                <strong>Resumo do período:</strong> {formatNumber(salesData.totalSales)} vendas realizadas, 
                totalizando {formatCurrency(salesData.totalRevenue)} em faturamento.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesReport