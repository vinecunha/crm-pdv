// pages/Reports.jsx
import React, { useState, useEffect } from 'react'
import {
  BarChart3, TrendingUp, TrendingDown, DollarSign,
  Package, Users, ShoppingCart, Calendar,
  FileText, Download, Filter, RefreshCw,
  PieChart, Activity, Award, AlertCircle,
  ChevronRight, Eye, Printer, FileSpreadsheet,
  Clock, CheckCircle, XCircle, CreditCard,
  Tag, Percent, Truck, Store
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import DataFilters from '../components/ui/DataFilters'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import Badge from '../components/Badge'
import useSystemLogs from '../hooks/useSystemLogs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
)

const Reports = () => {
  const { profile } = useAuth()
  const { logAction, logError } = useSystemLogs()
  
  // Estados
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('sales') // sales, products, customers, stock
  const [dateRange, setDateRange] = useState('month') // today, week, month, year, custom
  const [customDateRange, setCustomDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  
  // Dados dos relatórios
  const [salesData, setSalesData] = useState(null)
  const [productsData, setProductsData] = useState(null)
  const [customersData, setCustomersData] = useState(null)
  const [stockData, setStockData] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  
  // Filtros específicos
  const [categoryFilter, setCategoryFilter] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('')

  // Log de acesso
  useEffect(() => {
    logAction({
      action: 'VIEW',
      entityType: 'report',
      details: {
        component: 'Reports',
        user_role: profile?.role
      }
    })
  }, [])

  // Carregar dados quando a tab ou filtros mudarem
  useEffect(() => {
    loadReportData()
  }, [activeTab, dateRange, customDateRange, categoryFilter, paymentMethodFilter])

  const getDateRangeFilter = () => {
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

  const loadReportData = async () => {
    setLoading(true)
    try {
      const { startDate, endDate } = getDateRangeFilter()
      
      switch (activeTab) {
        case 'sales':
          await loadSalesReport(startDate, endDate)
          break
        case 'products':
          await loadProductsReport(startDate, endDate)
          break
        case 'customers':
          await loadCustomersReport(startDate, endDate)
          break
        case 'stock':
          await loadStockReport()
          break
      }
    } catch (error) {
      console.error('Erro ao carregar relatório:', error)
      showFeedback('error', 'Erro ao carregar dados do relatório')
      await logError('report', error, { action: 'load_report', tab: activeTab })
    } finally {
      setLoading(false)
    }
  }

  const loadSalesReport = async (startDate, endDate) => {
    // Buscar vendas no período
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
    
    // Calcular estatísticas
    const totalSales = sales?.length || 0
    const totalRevenue = sales?.reduce((sum, s) => sum + (s.final_amount || 0), 0) || 0
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0
    const totalDiscount = sales?.reduce((sum, s) => sum + (s.discount_amount || 0), 0) || 0
    
    // Vendas por dia (para gráfico)
    const salesByDay = {}
    const revenueByDay = {}
    
    sales?.forEach(sale => {
      const day = new Date(sale.created_at).toLocaleDateString('pt-BR')
      salesByDay[day] = (salesByDay[day] || 0) + 1
      revenueByDay[day] = (revenueByDay[day] || 0) + (sale.final_amount || 0)
    })
    
    // Vendas por método de pagamento
    const salesByPayment = {}
    sales?.forEach(sale => {
      const method = sale.payment_method || 'outros'
      salesByPayment[method] = (salesByPayment[method] || 0) + (sale.final_amount || 0)
    })
    
    // Últimas vendas
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
  }

  const loadProductsReport = async (startDate, endDate) => {
    // Buscar produtos mais vendidos via sales_items
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
      const category = stat.product.category || 'Sem categoria'
      categoryStats[category] = (categoryStats[category] || 0) + stat.quantity
    })
    
    // Produtos com estoque baixo
    const { data: lowStockProducts } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .lte('stock_quantity', supabase.raw('min_stock'))
    
    setProductsData({
      totalProductsSold: saleItems?.length || 0,
      totalRevenue: sortedProducts.reduce((sum, p) => sum + p.revenue, 0),
      topProducts: sortedProducts.slice(0, 5),
      categoryStats: Object.entries(categoryStats).map(([category, quantity]) => ({ category, quantity })),
      lowStockCount: lowStockProducts?.length || 0
    })
  }

  const loadCustomersReport = async (startDate, endDate) => {
    // Buscar clientes com compras no período
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .order('total_purchases', { ascending: false })
    
    if (error) throw error
    
    // Buscar vendas do período para análise de fidelidade
    const { data: sales } = await supabase
      .from('sales')
      .select('customer_id, final_amount')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .not('customer_id', 'is', null)
    
    // Agrupar por cliente
    const customerPurchases = {}
    sales?.forEach(sale => {
      if (!customerPurchases[sale.customer_id]) {
        customerPurchases[sale.customer_id] = {
          count: 0,
          total: 0
        }
      }
      customerPurchases[sale.customer_id].count += 1
      customerPurchases[sale.customer_id].total += sale.final_amount || 0
    })
    
    // Enriquecer dados dos clientes
    const enrichedCustomers = customers?.map(customer => ({
      ...customer,
      period_purchases: customerPurchases[customer.id]?.count || 0,
      period_total: customerPurchases[customer.id]?.total || 0
    })).sort((a, b) => b.period_total - a.period_total)
    
    setTopCustomers(enrichedCustomers?.slice(0, 10) || [])
    
    setCustomersData({
      totalCustomers: customers?.length || 0,
      activeCustomers: customers?.filter(c => c.status === 'active').length || 0,
      newCustomers: customers?.filter(c => {
        const createdAt = new Date(c.created_at)
        return createdAt >= startDate && createdAt <= endDate
      }).length || 0,
      totalRevenue: enrichedCustomers?.reduce((sum, c) => sum + (c.total_purchases || 0), 0) || 0,
      averagePerCustomer: customers?.length > 0 
        ? (enrichedCustomers?.reduce((sum, c) => sum + (c.total_purchases || 0), 0) || 0) / customers.length 
        : 0
    })
  }

  const loadStockReport = async () => {
    // Buscar todos os produtos ativos
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
    
    if (categoryFilter) {
      query = query.eq('category', categoryFilter)
    }
    
    const { data: products, error } = await query
    
    if (error) throw error
    
    // Estatísticas de estoque
    const totalProducts = products?.length || 0
    const totalStockValue = products?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost_price || 0)), 0) || 0
    const totalSellValue = products?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.price || 0)), 0) || 0
    const lowStockCount = products?.filter(p => p.stock_quantity <= p.min_stock).length || 0
    const outOfStockCount = products?.filter(p => p.stock_quantity <= 0).length || 0
    
    // Estoque por categoria
    const stockByCategory = {}
    products?.forEach(p => {
      const category = p.category || 'Sem categoria'
      if (!stockByCategory[category]) {
        stockByCategory[category] = {
          quantity: 0,
          value: 0
        }
      }
      stockByCategory[category].quantity += p.stock_quantity || 0
      stockByCategory[category].value += (p.stock_quantity || 0) * (p.cost_price || 0)
    })
    
    // Movimentações recentes
    const { data: recentMovements } = await supabase
      .from('stock_movements')
      .select(`
        *,
        product:products(name, unit)
      `)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setStockData({
      totalProducts,
      totalStockValue,
      totalSellValue,
      lowStockCount,
      outOfStockCount,
      potentialProfit: totalSellValue - totalStockValue,
      stockByCategory: Object.entries(stockByCategory).map(([category, data]) => ({
        category,
        quantity: data.quantity,
        value: data.value
      })),
      recentMovements: recentMovements || []
    })
  }

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 4000)
  }

  const handleExport = (format = 'csv') => {
    // Implementar exportação
    showFeedback('info', `Exportando relatório em ${format.toUpperCase()}...`)
    logAction({
      action: 'EXPORT',
      entityType: 'report',
      details: { format, tab: activeTab }
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatNumber = (value) => {
    return (value || 0).toLocaleString('pt-BR')
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('pt-BR')
  }

  // Configuração dos gráficos
  const salesChartData = {
    labels: salesData?.revenueByDay?.map(d => d.date) || [],
    datasets: [
      {
        label: 'Faturamento (R$)',
        data: salesData?.revenueByDay?.map(d => d.amount) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 8,
        fill: true
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
          'rgba(34, 197, 94, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(107, 114, 128, 0.7)'
        ],
        borderWidth: 0
      }
    ]
  }

  const topProductsChartData = {
    labels: topProducts?.map(p => p.product?.name?.substring(0, 20)) || [],
    datasets: [
      {
        label: 'Quantidade Vendida',
        data: topProducts?.map(p => p.quantity) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.6)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  }

  const categoryChartData = {
    labels: productsData?.categoryStats?.map(c => c.category) || [],
    datasets: [
      {
        data: productsData?.categoryStats?.map(c => c.quantity) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(107, 114, 128, 0.7)'
        ]
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
    }
  }

  // Renderizar cards de resumo
  const renderSummaryCards = () => {
    switch (activeTab) {
      case 'sales':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        )
      
      case 'products':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              title="Produtos Vendidos"
              value={formatNumber(productsData?.totalProductsSold || 0)}
              icon={Package}
              color="blue"
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
              color="red"
              alert={productsData?.lowStockCount > 0}
            />
            <SummaryCard
              title="Categorias Ativas"
              value={formatNumber(productsData?.categoryStats?.length || 0)}
              icon={Tag}
              color="purple"
            />
          </div>
        )
      
      case 'customers':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              title="Total de Clientes"
              value={formatNumber(customersData?.totalCustomers || 0)}
              icon={Users}
              color="blue"
            />
            <SummaryCard
              title="Clientes Ativos"
              value={formatNumber(customersData?.activeCustomers || 0)}
              icon={CheckCircle}
              color="green"
            />
            <SummaryCard
              title="Novos Clientes"
              value={formatNumber(customersData?.newCustomers || 0)}
              icon={TrendingUp}
              color="purple"
              subtitle="No período"
            />
            <SummaryCard
              title="Média por Cliente"
              value={formatCurrency(customersData?.averagePerCustomer || 0)}
              icon={Award}
              color="orange"
            />
          </div>
        )
      
      case 'stock':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              title="Produtos em Estoque"
              value={formatNumber(stockData?.totalProducts || 0)}
              icon={Package}
              color="blue"
            />
            <SummaryCard
              title="Valor do Estoque"
              value={formatCurrency(stockData?.totalStockValue || 0)}
              icon={DollarSign}
              color="green"
              subtitle={`Custo total`}
            />
            <SummaryCard
              title="Estoque Baixo"
              value={formatNumber(stockData?.lowStockCount || 0)}
              icon={AlertCircle}
              color="orange"
              alert={stockData?.lowStockCount > 0}
            />
            <SummaryCard
              title="Sem Estoque"
              value={formatNumber(stockData?.outOfStockCount || 0)}
              icon={XCircle}
              color="red"
              alert={stockData?.outOfStockCount > 0}
            />
          </div>
        )
      
      default:
        return null
    }
  }

  if (loading && !salesData && !productsData && !customersData && !stockData) {
    return <DataLoadingSkeleton type="cards" rows={4} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-blue-600" />
                Relatórios e Análises
              </h1>
              <p className="text-gray-600 mt-1">
                Visualize e analise os dados do seu negócio
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} icon={Printer}>
                Imprimir
              </Button>
              <Button variant="outline" onClick={() => handleExport('csv')} icon={FileSpreadsheet}>
                Exportar
              </Button>
              <Button onClick={loadReportData} icon={RefreshCw}>
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false })}
            />
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex flex-wrap gap-1">
            <TabButton
              active={activeTab === 'sales'}
              onClick={() => setActiveTab('sales')}
              icon={ShoppingCart}
            >
              Vendas
            </TabButton>
            <TabButton
              active={activeTab === 'products'}
              onClick={() => setActiveTab('products')}
              icon={Package}
            >
              Produtos
            </TabButton>
            <TabButton
              active={activeTab === 'customers'}
              onClick={() => setActiveTab('customers')}
              icon={Users}
            >
              Clientes
            </TabButton>
            <TabButton
              active={activeTab === 'stock'}
              onClick={() => setActiveTab('stock')}
              icon={Store}
            >
              Estoque
            </TabButton>
          </nav>
        </div>

        {/* Filtros de Data */}
        <div className="mb-6">
          <DataFilters
            searchPlaceholder=""
            searchValue=""
            onSearchChange={() => {}}
            showFilters={true}
            filters={[
              {
                key: 'dateRange',
                label: 'Período',
                type: 'select',
                options: [
                  { value: 'today', label: 'Hoje' },
                  { value: 'week', label: 'Últimos 7 dias' },
                  { value: 'month', label: 'Últimos 30 dias' },
                  { value: 'year', label: 'Último ano' },
                  { value: 'custom', label: 'Personalizado' }
                ]
              },
              ...(activeTab === 'sales' ? [{
                key: 'paymentMethod',
                label: 'Forma de Pagamento',
                type: 'select',
                options: [
                  { value: '', label: 'Todos' },
                  { value: 'cash', label: 'Dinheiro' },
                  { value: 'credit', label: 'Crédito' },
                  { value: 'debit', label: 'Débito' },
                  { value: 'pix', label: 'PIX' }
                ]
              }] : []),
              ...(activeTab === 'stock' ? [{
                key: 'category',
                label: 'Categoria',
                type: 'select',
                options: [
                  { value: '', label: 'Todas' },
                  { value: 'Alimentos', label: 'Alimentos' },
                  { value: 'Bebidas', label: 'Bebidas' },
                  { value: 'Limpeza', label: 'Limpeza' }
                ]
              }] : [])
            ]}
            onFilterChange={(filters) => {
              setDateRange(filters.dateRange || 'month')
              setPaymentMethodFilter(filters.paymentMethod || '')
              setCategoryFilter(filters.category || '')
            }}
          />
          
          {dateRange === 'custom' && (
            <div className="mt-3 flex gap-3">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>

        {/* Cards de Resumo */}
        {renderSummaryCards()}

        {/* Conteúdo específico da tab */}
        <div className="space-y-6">
          {/* Vendas */}
          {activeTab === 'sales' && (
            <>
              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Faturamento no Período</h3>
                  <div className="h-64">
                    <Line data={salesChartData} options={chartOptions} />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Vendas por Forma de Pagamento</h3>
                  <div className="h-64">
                    <Doughnut data={paymentMethodsChartData} options={{
                      ...chartOptions,
                      plugins: { legend: { display: true, position: 'bottom' } }
                    }} />
                  </div>
                </div>
              </div>

              {/* Últimas Vendas */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Últimas Vendas</h3>
                </div>
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
                          <td className="px-6 py-4 text-sm">{sale.customer_name || 'Cliente não identificado'}</td>
                          <td className="px-6 py-4 text-sm">{formatDateTime(sale.created_at)}</td>
                          <td className="px-6 py-4 text-sm">
                            <Badge variant="default">
                              {sale.payment_method === 'cash' ? 'Dinheiro' :
                               sale.payment_method === 'credit' ? 'Crédito' :
                               sale.payment_method === 'debit' ? 'Débito' : 'PIX'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-medium">
                            {formatCurrency(sale.final_amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Produtos */}
          {activeTab === 'products' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Top 10 Produtos Mais Vendidos</h3>
                  <div className="h-64">
                    <Bar data={topProductsChartData} options={chartOptions} />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Vendas por Categoria</h3>
                  <div className="h-64">
                    <Doughnut data={categoryChartData} options={{
                      ...chartOptions,
                      plugins: { legend: { display: true, position: 'bottom' } }
                    }} />
                  </div>
                </div>
              </div>

              {/* Lista de Produtos Mais Vendidos */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Ranking de Produtos</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={product.product?.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium">{product.product?.name}</p>
                            <p className="text-xs text-gray-500">{product.product?.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatNumber(product.quantity)} vendidos</p>
                          <p className="text-sm text-green-600">{formatCurrency(product.revenue)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Clientes */}
          {activeTab === 'customers' && (
            <>
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Top Clientes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Contato</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500">Compras (Período)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Total (Período)</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Total Histórico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {topCustomers.map((customer, index) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-purple-600">#{index + 1}</span>
                              </div>
                              <div>
                                <p className="font-medium">{customer.name}</p>
                                <p className="text-xs text-gray-500">Cliente desde {formatDate(customer.created_at)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <p>{customer.phone}</p>
                            <p className="text-xs text-gray-500">{customer.email}</p>
                          </td>
                          <td className="px-6 py-4 text-center text-sm">
                            {customer.period_purchases}
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                            {formatCurrency(customer.period_total)}
                          </td>
                          <td className="px-6 py-4 text-right text-sm">
                            {formatCurrency(customer.total_purchases)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Estoque */}
          {activeTab === 'stock' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Valor do Estoque por Categoria</h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {stockData?.stockByCategory.map(cat => (
                      <div key={cat.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{cat.category}</p>
                          <p className="text-xs text-gray-500">{formatNumber(cat.quantity)} unidades</p>
                        </div>
                        <p className="font-semibold text-blue-600">{formatCurrency(cat.value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold mb-4">Resumo do Estoque</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Valor de Custo</span>
                      <span className="font-semibold">{formatCurrency(stockData?.totalStockValue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Valor de Venda</span>
                      <span className="font-semibold">{formatCurrency(stockData?.totalSellValue || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <span className="text-green-700">Lucro Potencial</span>
                      <span className="font-bold text-green-700">{formatCurrency(stockData?.potentialProfit || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Movimentações Recentes */}
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Últimas Movimentações de Estoque</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Produto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Tipo</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">Quantidade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Motivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {stockData?.recentMovements.map(movement => (
                        <tr key={movement.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm">{movement.product?.name}</td>
                          <td className="px-6 py-4 text-sm">
                            <Badge variant={
                              movement.movement_type === 'ENTRY' ? 'success' :
                              movement.movement_type === 'SALE' ? 'default' :
                              'warning'
                            }>
                              {movement.movement_type === 'ENTRY' ? 'Entrada' :
                               movement.movement_type === 'SALE' ? 'Venda' :
                               movement.movement_type === 'ADJUSTMENT' ? 'Ajuste' : movement.movement_type}
                            </Badge>
                          </td>
                          <td className={`px-6 py-4 text-right text-sm font-medium ${
                            movement.quantity > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </td>
                          <td className="px-6 py-4 text-sm">{formatDateTime(movement.created_at)}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{movement.reason || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Componentes auxiliares
const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
      ${active 
        ? 'border-blue-600 text-blue-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }
    `}
  >
    <Icon size={18} />
    {children}
  </button>
)

const SummaryCard = ({ title, value, icon: Icon, color, trend, subtitle, alert }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600'
  }

  return (
    <div className={`bg-white rounded-lg border p-6 ${alert ? 'border-red-300' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
      {trend && (
        <div className="mt-2">
          {trend === 'up' && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp size={12} /> Em alta
            </span>
          )}
          {trend === 'down' && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <TrendingDown size={12} /> Em baixa
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default Reports