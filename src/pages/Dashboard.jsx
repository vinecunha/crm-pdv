import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Users, ShoppingCart, Package, TrendingUp, 
  ChevronRight, Plus, UserPlus, CreditCard,
  DollarSign, AlertCircle, LayoutDashboard
} from '../lib/icons'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'
import SectionErrorBoundary from '../components/SectionErrorBoundary'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Button from '../components/ui/Button'
import SummaryCard from '../components/reports/SummaryCard'
import Badge from '../components/Badge'
import PageHeader from '../components/ui/PageHeader'
import { Line } from 'react-chartjs-2'
import '../lib/chartConfig'

const fetchDashboardData = async () => {
  const [
    customersResult,
    salesResult,
    productsResult,
    saleItemsResult
  ] = await Promise.allSettled([
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('sales').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('is_active', true),
    supabase.from('sale_items').select(`
      quantity,
      product_id,
      product:products(name),
      created_at
    `).order('created_at', { ascending: false }).limit(500)
  ])

  const customersCount = customersResult.status === 'fulfilled' && !customersResult.value.error
    ? customersResult.value.count || 0
    : 0

  const sales = salesResult.status === 'fulfilled' && !salesResult.value.error
    ? salesResult.value.data || []
    : []

  const products = productsResult.status === 'fulfilled' && !productsResult.value.error
    ? productsResult.value.data || []
    : []

  const saleItems = saleItemsResult.status === 'fulfilled' && !saleItemsResult.value.error
    ? saleItemsResult.value.data || []
    : []

  return { customersCount, sales, products, saleItems }
}

const Dashboard = () => {
  const { profile, permissions } = useAuth()

  const { 
    data: rawData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 2 * 60 * 1000,
  })

  const dashboardData = React.useMemo(() => {
    if (!rawData) return null

    const { customersCount, sales, products, saleItems } = rawData

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    
    const last7Days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      last7Days.push(date)
    }

    const salesByDay = {}
    last7Days.forEach(date => {
      const key = date.toISOString().split('T')[0]
      salesByDay[key] = 0
    })

    const salesToday = sales.filter(sale => new Date(sale.created_at) >= today)
    const salesYesterday = sales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate >= yesterday && saleDate < today
    })

    const totalSalesToday = salesToday.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)
    const totalSalesYesterday = salesYesterday.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)

    const salesThisMonth = sales.filter(sale => new Date(sale.created_at) >= startOfMonth)
    const salesLastMonth = sales.filter(sale => {
      const saleDate = new Date(sale.created_at)
      return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth
    })

    const totalSalesMonth = salesThisMonth.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)
    const totalSalesLastMonth = salesLastMonth.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)

    salesThisMonth.forEach(sale => {
      const dateKey = new Date(sale.created_at).toISOString().split('T')[0]
      if (salesByDay[dateKey] !== undefined) {
        salesByDay[dateKey] += sale.final_amount || 0
      }
    })

    const averageTicket = salesToday.length > 0 ? totalSalesToday / salesToday.length : 0
    const averageTicketYesterday = salesYesterday.length > 0 ? totalSalesYesterday / salesYesterday.length : 0

    const salesChange = totalSalesYesterday > 0 
      ? ((totalSalesToday - totalSalesYesterday) / totalSalesYesterday) * 100 
      : 0
    const monthChange = totalSalesLastMonth > 0
      ? ((totalSalesMonth - totalSalesLastMonth) / totalSalesLastMonth) * 100
      : 0
    const ticketChange = averageTicketYesterday > 0
      ? ((averageTicket - averageTicketYesterday) / averageTicketYesterday) * 100
      : 0

    const lowStockProducts = products.filter(p => 
      (p.stock_quantity || 0) <= (p.min_stock || 5)
    )

    const productSalesMap = {}
    saleItems.forEach(item => {
      const productId = item.product_id
      const productName = item.product?.name || 'Produto'
      if (!productSalesMap[productId]) {
        productSalesMap[productId] = {
          name: productName,
          quantity: 0
        }
      }
      productSalesMap[productId].quantity += item.quantity || 0
    })

    const topProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)

    const recentSales = sales.slice(0, 5).map(sale => ({
      id: sale.id,
      sale_number: sale.sale_number,
      customer: sale.customer_name || 'Cliente não identificado',
      amount: sale.final_amount || 0,
      payment_method: sale.payment_method,
      status: sale.status || 'completed',
      date: sale.created_at
    }))

    return {
      stats: {
        salesToday: { value: totalSalesToday, change: Math.abs(salesChange), trend: salesChange >= 0 ? 'up' : 'down' },
        salesMonth: { value: totalSalesMonth, change: Math.abs(monthChange), trend: monthChange >= 0 ? 'up' : 'down' },
        products: { value: products.length },
        customers: { value: customersCount },
        averageTicket: { value: averageTicket, change: Math.abs(ticketChange), trend: ticketChange >= 0 ? 'up' : 'down' },
        lowStockProducts: { value: lowStockProducts.length }
      },
      recentSales,
      topProducts,
      chartData: {
        labels: last7Days.map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
        datasets: [{
          label: 'Vendas (R$)',
          data: last7Days.map(d => salesByDay[d.toISOString().split('T')[0]] || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      }
    }
  }, [rawData])

  const quickActions = React.useMemo(() => {
    const actions = []
    
    if (permissions.canViewSales) {
      actions.push({ label: 'Nova Venda', icon: ShoppingCart, path: '/sales', color: 'blue' })
    }
    if (permissions.canViewCustomers) {
      actions.push({ label: 'Novo Cliente', icon: UserPlus, path: '/customers', color: 'green' })
    }
    if (permissions.canViewProducts) {
      actions.push({ label: 'Novo Produto', icon: Plus, path: '/products', color: 'purple' })
    }
    if (permissions.canManageStock) {
      actions.push({ label: 'Balanço', icon: Package, path: '/stock-count', color: 'orange' })
    }
    
    return actions
  }, [permissions])

  const getStatusBadge = (status) => {
    const config = {
      completed: { label: 'Concluída', variant: 'success' },
      pending: { label: 'Pendente', variant: 'warning' },
      cancelled: { label: 'Cancelada', variant: 'danger' }
    }
    const { label, variant } = config[status] || config.pending
    return <Badge variant={variant} size="sm">{label}</Badge>
  }

  const getPaymentMethodLabel = (method) => {
    const methods = { cash: 'Dinheiro', credit: 'Crédito', debit: 'Débito', pix: 'PIX' }
    return methods[method] || method
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `R$ ${context.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `R$ ${value}`
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.2)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  // Configuração das ações do header
  const headerActions = quickActions.map(action => ({
    label: action.label,
    icon: action.icon,
    onClick: undefined,
    variant: 'outline',
    asLink: true,
    to: action.path
  }))

  if (isLoading) {
    return <DataLoadingSkeleton type="cards" rows={4} />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (!dashboardData) return null

  const { stats, recentSales, topProducts, chartData } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageHeader
          title="Visão Geral"
          description="Acompanhe os principais indicadores do seu negócio"
          icon={LayoutDashboard}
          actions={headerActions.map(action => ({
            ...action,
            render: () => (
              <Link key={action.to} to={action.to}>
                <Button size="sm" variant="outline" icon={action.icon}>
                  <span className="hidden xs:inline">{action.label}</span>
                </Button>
              </Link>
            )
          }))}
        />

        {/* Cards de estatísticas - Linha 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <SectionErrorBoundary title="Erro nas vendas de hoje">
            <SummaryCard
              title="Vendas Hoje"
              value={formatCurrency(stats.salesToday.value)}
              icon={ShoppingCart}
              color="blue"
              trend={stats.salesToday.trend}
              subtitle={`${stats.salesToday.change.toFixed(1)}% vs ontem`}
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro nas vendas do mês">
            <SummaryCard
              title="Vendas no Mês"
              value={formatCurrency(stats.salesMonth.value)}
              icon={TrendingUp}
              color="green"
              trend={stats.salesMonth.trend}
              subtitle={`${stats.salesMonth.change.toFixed(1)}% vs mês anterior`}
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro no ticket médio">
            <SummaryCard
              title="Ticket Médio"
              value={formatCurrency(stats.averageTicket.value)}
              icon={CreditCard}
              color="purple"
              trend={stats.averageTicket.trend}
              subtitle={`${stats.averageTicket.change.toFixed(1)}% vs ontem`}
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro nos clientes">
            <SummaryCard
              title="Total de Clientes"
              value={formatNumber(stats.customers.value)}
              icon={Users}
              color="indigo"
            />
          </SectionErrorBoundary>
        </div>

        {/* Cards de estatísticas - Linha 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <SectionErrorBoundary title="Erro nos produtos">
            <SummaryCard
              title="Produtos Ativos"
              value={formatNumber(stats.products.value)}
              icon={Package}
              color="cyan"
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro no estoque baixo">
            <SummaryCard
              title="Estoque Baixo"
              value={formatNumber(stats.lowStockProducts.value)}
              icon={AlertCircle}
              color="orange"
              alert={stats.lowStockProducts.value > 0}
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro no faturamento">
            <SummaryCard
              title="Faturamento Total"
              value={formatCurrency(stats.salesMonth.value)}
              icon={DollarSign}
              color="green"
            />
          </SectionErrorBoundary>
        </div>

        {/* Gráfico */}
        <SectionErrorBoundary title="Erro no gráfico de vendas">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Vendas dos Últimos 7 Dias</h2>
            <div className="h-48 sm:h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </SectionErrorBoundary>

        {/* Últimas Vendas e Produtos Mais Vendidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SectionErrorBoundary title="Erro nas últimas vendas">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Últimas Vendas</h2>
                <Link to="/sales-list" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                  Ver todas <ChevronRight size={16} />
                </Link>
              </div>
              
              {recentSales.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                  <ShoppingCart className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">Nenhuma venda registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">#{sale.sale_number}</p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{sale.customer}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(sale.date)} • {getPaymentMethodLabel(sale.payment_method)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end sm:text-right gap-2">
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">{formatCurrency(sale.amount)}</p>
                        {getStatusBadge(sale.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro nos produtos mais vendidos">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Produtos Mais Vendidos</h2>
                <Link to="/reports" className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1">
                  Relatórios <ChevronRight size={16} />
                </Link>
              </div>
              
              {topProducts.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                  <Package className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-sm">Nenhuma venda registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                          index === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300' :
                          index === 2 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm truncate max-w-[120px] sm:max-w-none">{product.name}</span>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{formatNumber(product.quantity)}</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">unidades</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionErrorBoundary>
        </div>
      </div>
    </div>
  )
}

export default Dashboard