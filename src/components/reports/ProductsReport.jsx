import React, { useState, useEffect, useRef } from 'react'
import { Package, DollarSign, AlertCircle, Tag, TrendingUp } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import SummaryCard from './SummaryCard'
import DataLoadingSkeleton from '../ui/DataLoadingSkeleton'
import { Bar, Doughnut } from 'react-chartjs-2'
import '../../lib/chartConfig' 

const ProductsReport = ({ dateRange, customDateRange }) => {
  const [loading, setLoading] = useState(true)
  const [productsData, setProductsData] = useState(null)
  const [topProducts, setTopProducts] = useState([])

  const lineChartId = useRef(`line-chart-${Date.now()}-${Math.random().toString(36)}`)
  const doughnutChartId = useRef(`doughnut-chart-${Date.now()}-${Math.random().toString(36)}`)

  useEffect(() => {
    loadProductsReport()
  }, [dateRange, customDateRange])

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

  const loadProductsReport = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRange()

      // Buscar produtos mais vendidos via sale_items
      const { data: saleItems, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          unit_price,
          total,
          product:products(*)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      
      if (error) throw error
      
      // Agrupar por produto
      const productStats = {}
      saleItems?.forEach(item => {
        const productId = item.product?.id
        if (!productId) return
        
        if (!productStats[productId]) {
          productStats[productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0
          }
        }
        
        productStats[productId].quantity += item.quantity || 0
        productStats[productId].revenue += item.total || 0
      })
      
      // Ordenar por quantidade vendida
      const sortedProducts = Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
      
      // Top 10 produtos
      setTopProducts(sortedProducts.slice(0, 10))
      
      // Produtos por categoria
      const categoryStats = {}
      sortedProducts.forEach(stat => {
        const category = stat.product?.category || 'Sem categoria'
        categoryStats[category] = (categoryStats[category] || 0) + stat.quantity
      })
      
      // Produtos com estoque baixo
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .lte('stock_quantity', supabase.raw('min_stock'))
      
      // Total de produtos ativos
      const { count: totalActiveProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      setProductsData({
        totalItemsSold: saleItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0,
        totalRevenue: sortedProducts.reduce((sum, p) => sum + p.revenue, 0),
        totalActiveProducts: totalActiveProducts || 0,
        topProducts: sortedProducts.slice(0, 5),
        categoryStats: Object.entries(categoryStats)
          .map(([category, quantity]) => ({ category, quantity }))
          .sort((a, b) => b.quantity - a.quantity),
        lowStockCount: lowStockProducts?.length || 0,
        lowStockProducts: lowStockProducts?.slice(0, 5) || []
      })

    } catch (error) {
      console.error('Erro ao carregar relatório de produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Configuração dos gráficos
  const topProductsChartData = {
    labels: topProducts?.map(p => p.product?.name?.substring(0, 20) + (p.product?.name?.length > 20 ? '...' : '')) || [],
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: topProducts?.map(p => p.quantity) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  }

  const categoryChartData = {
    labels: productsData?.categoryStats?.slice(0, 6).map(c => c.category) || [],
    datasets: [
      {
        data: productsData?.categoryStats?.slice(0, 6).map(c => c.quantity) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(234, 179, 8, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
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
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
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
            return `${formatNumber(value)} unidades (${percentage}%)`
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
          title="Itens Vendidos"
          value={formatNumber(productsData?.totalItemsSold || 0)}
          icon={Package}
          color="blue"
          subtitle="Período selecionado"
        />
        <SummaryCard
          title="Receita com Produtos"
          value={formatCurrency(productsData?.totalRevenue || 0)}
          icon={DollarSign}
          color="green"
        />
        <SummaryCard
          title="Produtos com Estoque Baixo"
          value={formatNumber(productsData?.lowStockCount || 0)}
          icon={AlertCircle}
          color="orange"
          alert={productsData?.lowStockCount > 0}
        />
        <SummaryCard
          title="Produtos Ativos"
          value={formatNumber(productsData?.totalActiveProducts || 0)}
          icon={Tag}
          color="purple"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Top 10 Produtos Mais Vendidos</h3>
          <div className="h-64">
            {topProducts.length > 0 ? (
              <Bar data={topProductsChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Nenhuma venda no período</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Vendas por Categoria</h3>
          <div className="h-64">
            {productsData?.categoryStats?.length > 0 ? (
              <Doughnut data={categoryChartData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">Nenhum dado disponível</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ranking de Produtos */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            Ranking de Produtos Mais Vendidos
          </h3>
        </div>
        
        {topProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma venda no período</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-3">
              {topProducts.map((product, index) => (
                <div 
                  key={product.product?.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-200 text-gray-600' :
                        index === 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-600'}
                    `}>
                      #{index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.product?.name}</p>
                      <p className="text-xs text-gray-500">
                        {product.product?.category || 'Sem categoria'} | 
                        Estoque atual: {product.product?.stock_quantity || 0} {product.product?.unit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatNumber(product.quantity)} vendidos</p>
                    <p className="text-sm text-green-600">{formatCurrency(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Produtos com Estoque Baixo */}
      {productsData?.lowStockProducts?.length > 0 && (
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
            <AlertCircle size={20} />
            Produtos com Estoque Baixo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {productsData.lowStockProducts.map(product => (
              <div key={product.id} className="bg-white rounded-lg p-3 border border-orange-100">
                <p className="font-medium text-gray-900 truncate">{product.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">Estoque atual:</span>
                  <span className="text-sm font-semibold text-orange-600">
                    {product.stock_quantity} / {product.min_stock} {product.unit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-orange-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min((product.stock_quantity / product.min_stock) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsReport