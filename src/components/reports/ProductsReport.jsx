import React, { useState, useEffect } from 'react'
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
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProductsReport()
  }, [dateRange, customDateRange])

  const getDateRange = () => {
    const now = new Date()
    let startDate, endDate
    
    switch (dateRange) {
      case 'today':
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
        break
      case 'week':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
        break
      case 'month':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
        break
      case 'year':
        startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - 1)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
        break
      case 'custom':
        startDate = new Date(customDateRange.start)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(customDateRange.end)
        endDate.setHours(23, 59, 59, 999)
        break
      default:
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date()
    }
    
    return { startDate, endDate }
  }

  const loadProductsReport = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { startDate, endDate } = getDateRange()
      
      console.log('📊 Buscando itens...', {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      })

      // Buscar itens de venda - APENAS colunas que existem
      const { data: saleItems, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          unit_price,
          total_price,
          product_id,
          created_at
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false })

      if (itemsError) {
        console.error('❌ Erro ao buscar itens:', itemsError)
        throw itemsError
      }

      console.log(`✅ ${saleItems?.length || 0} itens encontrados`)

      // Buscar produtos separadamente
      const productIds = [...new Set(saleItems?.map(item => item.product_id).filter(Boolean)) || []]
      
      let productsMap = {}
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('id, name, code, category, unit, stock_quantity, price, cost_price, min_stock')
          .in('id', productIds)

        if (!productsError && products) {
          productsMap = products.reduce((acc, p) => {
            acc[p.id] = p
            return acc
          }, {})
        }
      }

      // Processar itens
      if (saleItems && saleItems.length > 0) {
        processSaleItems(saleItems, productsMap)
      } else {
        setProductsData(prev => ({
          ...prev,
          totalItemsSold: 0,
          totalRevenue: 0,
          categoryStats: []
        }))
        setTopProducts([])
      }

      // Buscar produtos ativos
      await fetchActiveProducts()

    } catch (error) {
      console.error('❌ Erro ao carregar relatório:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const processSaleItems = (saleItems, productsMap) => {
    const productStats = {}
    let totalItemsSold = 0
    let totalRevenue = 0

    saleItems.forEach(item => {
      const productId = item.product_id
      if (!productId) return
      
      const quantity = parseFloat(item.quantity) || 0
      const itemTotal = parseFloat(item.total_price) || 0
      
      totalItemsSold += quantity
      totalRevenue += itemTotal
      
      if (!productStats[productId]) {
        productStats[productId] = {
          product: productsMap[productId] || null,
          quantity: 0,
          revenue: 0
        }
      }
      
      productStats[productId].quantity += quantity
      productStats[productId].revenue += itemTotal
    })

    const sortedProducts = Object.values(productStats)
      .filter(p => p.product)
      .sort((a, b) => b.quantity - a.quantity)

    console.log(`📊 ${sortedProducts.length} produtos processados, ${totalItemsSold} itens, R$ ${totalRevenue}`)

    setTopProducts(sortedProducts.slice(0, 10))

    const categoryStats = {}
    sortedProducts.forEach(stat => {
      const category = stat.product?.category || 'Sem categoria'
      categoryStats[category] = (categoryStats[category] || 0) + stat.quantity
    })

    setProductsData(prev => ({
      ...prev,
      totalItemsSold,
      totalRevenue,
      categoryStats: Object.entries(categoryStats)
        .map(([category, quantity]) => ({ category, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
    }))
  }

  const fetchActiveProducts = async () => {
    try {
      const { data: activeProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock_quantity, min_stock, unit, category')
        .eq('is_active', true)

      if (productsError) {
        console.error('Erro ao buscar produtos:', productsError)
        return
      }

      const lowStockProducts = activeProducts?.filter(p => 
        (p.stock_quantity || 0) <= (p.min_stock || 5)
      ) || []

      console.log(`📦 ${activeProducts?.length || 0} produtos ativos, ${lowStockProducts.length} estoque baixo`)

      setProductsData(prev => ({
        ...prev,
        totalActiveProducts: activeProducts?.length || 0,
        lowStockCount: lowStockProducts.length,
        lowStockProducts: lowStockProducts.slice(0, 5)
      }))

    } catch (error) {
      console.error('Erro ao buscar produtos ativos:', error)
    }
  }

  const topProductsChartData = {
    labels: topProducts?.map(p => {
      const name = p.product?.name || 'Produto'
      return name.length > 20 ? name.substring(0, 18) + '...' : name
    }) || [],
    datasets: [{
      label: 'Quantidade Vendida',
      data: topProducts?.map(p => p.quantity) || [],
      backgroundColor: 'rgba(34, 197, 94, 0.6)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 1,
      borderRadius: 6
    }]
  }

  const categoryChartData = {
    labels: productsData?.categoryStats?.slice(0, 6).map(c => c.category) || [],
    datasets: [{
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
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => Math.floor(v) } } }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 15, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.raw
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0)
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0'
            return `${formatNumber(val)} un. (${pct}%)`
          }
        }
      }
    }
  }

  if (loading) return <DataLoadingSkeleton type="cards" rows={4} />

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
        <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
        <p className="text-red-600 font-medium">Erro ao carregar relatório</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    )
  }

  const hasData = productsData && productsData.totalItemsSold > 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Itens Vendidos" value={formatNumber(productsData?.totalItemsSold || 0)} icon={Package} color="blue" subtitle={hasData ? 'Período selecionado' : 'Sem vendas'} />
        <SummaryCard title="Receita" value={formatCurrency(productsData?.totalRevenue || 0)} icon={DollarSign} color="green" />
        <SummaryCard title="Estoque Baixo" value={formatNumber(productsData?.lowStockCount || 0)} icon={AlertCircle} color="orange" alert={productsData?.lowStockCount > 0} />
        <SummaryCard title="Produtos Ativos" value={formatNumber(productsData?.totalActiveProducts || 0)} icon={Tag} color="purple" />
      </div>

      {!hasData ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Package size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma venda no período</p>
          <p className="text-sm text-gray-400 mt-1">Tente selecionar outro período</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Top 10 Produtos</h3>
              <div className="h-64"><Bar data={topProductsChartData} options={chartOptions} /></div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Vendas por Categoria</h3>
              <div className="h-64">
                {productsData?.categoryStats?.length > 0 ? (
                  <Doughnut data={categoryChartData} options={doughnutOptions} />
                ) : (
                  <div className="flex items-center justify-center h-full"><p className="text-gray-500">Nenhum dado</p></div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="text-green-600" size={20} />Ranking de Produtos</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={p.product?.id || i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-600'}`}>#{i + 1}</div>
                      <div>
                        <p className="font-medium text-gray-900">{p.product?.name || 'Produto'}</p>
                        <p className="text-xs text-gray-500">{p.product?.category || 'Sem categoria'} | Estoque: {p.product?.stock_quantity || 0} {p.product?.unit || 'UN'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatNumber(p.quantity)} vendidos</p>
                      <p className="text-sm text-green-600">{formatCurrency(p.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {productsData?.lowStockProducts?.length > 0 && (
        <div className="bg-orange-50 rounded-lg border border-orange-200 p-6">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2"><AlertCircle size={20} />Produtos com Estoque Baixo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {productsData.lowStockProducts.map(p => (
              <div key={p.id} className="bg-white rounded-lg p-3 border border-orange-100">
                <p className="font-medium text-gray-900 truncate">{p.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">Estoque:</span>
                  <span className="text-sm font-semibold text-orange-600">{p.stock_quantity || 0} / {p.min_stock || 5} {p.unit || 'UN'}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                  <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min(((p.stock_quantity || 0) / (p.min_stock || 5)) * 100, 100)}%` }} />
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