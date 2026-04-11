import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  Users, ShoppingCart, Package, TrendingUp, 
  ArrowUp, ArrowDown, DollarSign, AlertCircle,
  ChevronRight, Plus, UserPlus, CreditCard
} from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'
import SectionErrorBoundary from '../components/SectionErrorBoundary'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import Button from '../components/ui/Button'
import SummaryCard from '../components/reports/SummaryCard'
import Badge from '../components/Badge'
import { Line } from 'react-chartjs-2'
import '../lib/chartConfig'

const Dashboard = () => {
  const { profile, isAdmin, permissions } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    salesToday: { value: 0, change: 0, trend: 'up' },
    salesMonth: { value: 0, change: 0, trend: 'up' },
    products: { value: 0 },
    customers: { value: 0 },
    averageTicket: { value: 0, change: 0, trend: 'up' },
    lowStockProducts: { value: 0 }
  })
  const [recentSales, setRecentSales] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [salesChartData, setSalesChartData] = useState({ labels: [], datasets: [] })
  const [quickActions, setQuickActions] = useState([])

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
      setupQuickActions()
    }
  }, [profile])

  const setupQuickActions = () => {
    const actions = []
    
    if (permissions.canViewSales) {
      actions.push({
        label: 'Nova Venda',
        icon: ShoppingCart,
        path: '/sales',
        color: 'blue'
      })
    }
    
    if (permissions.canViewCustomers) {
      actions.push({
        label: 'Novo Cliente',
        icon: UserPlus,
        path: '/customers',
        color: 'green'
      })
    }
    
    if (permissions.canViewProducts) {
      actions.push({
        label: 'Novo Produto',
        icon: Plus,
        path: '/products',
        color: 'purple'
      })
    }
    
    if (permissions.canManageStock) {
      actions.push({
        label: 'Balanço',
        icon: Package,
        path: '/stock-count',
        color: 'orange'
      })
    }
    
    setQuickActions(actions)
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Buscar dados em paralelo para melhor performance
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

      // Processar clientes
      const customersCount = customersResult.status === 'fulfilled' && !customersResult.value.error
        ? customersResult.value.count || 0
        : 0

      // Processar vendas
      const sales = salesResult.status === 'fulfilled' && !salesResult.value.error
        ? salesResult.value.data || []
        : []

      // Processar produtos
      const products = productsResult.status === 'fulfilled' && !productsResult.value.error
        ? productsResult.value.data || []
        : []

      // Processar itens de venda
      const saleItems = saleItemsResult.status === 'fulfilled' && !saleItemsResult.value.error
        ? saleItemsResult.value.data || []
        : []

      // Calcular datas
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
      
      // Últimos 7 dias para o gráfico
      const last7Days = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        last7Days.push(date)
      }

      // Vendas por dia (últimos 7 dias)
      const salesByDay = {}
      last7Days.forEach(date => {
        const key = date.toISOString().split('T')[0]
        salesByDay[key] = 0
      })

      // Vendas de hoje e ontem
      const salesToday = sales.filter(sale => new Date(sale.created_at) >= today)
      const salesYesterday = sales.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= yesterday && saleDate < today
      })

      const totalSalesToday = salesToday.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)
      const totalSalesYesterday = salesYesterday.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)

      // Vendas do mês
      const salesThisMonth = sales.filter(sale => new Date(sale.created_at) >= startOfMonth)
      const salesLastMonth = sales.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth
      })

      const totalSalesMonth = salesThisMonth.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)
      const totalSalesLastMonth = salesLastMonth.reduce((sum, sale) => sum + (sale.final_amount || 0), 0)

      // Preencher vendas por dia para o gráfico
      salesThisMonth.forEach(sale => {
        const dateKey = new Date(sale.created_at).toISOString().split('T')[0]
        if (salesByDay[dateKey] !== undefined) {
          salesByDay[dateKey] += sale.final_amount || 0
        }
      })

      // Ticket médio
      const averageTicket = salesToday.length > 0 ? totalSalesToday / salesToday.length : 0
      const averageTicketYesterday = salesYesterday.length > 0 ? totalSalesYesterday / salesYesterday.length : 0

      // Calcular variações
      const salesChange = totalSalesYesterday > 0 
        ? ((totalSalesToday - totalSalesYesterday) / totalSalesYesterday) * 100 
        : 0
      const monthChange = totalSalesLastMonth > 0
        ? ((totalSalesMonth - totalSalesLastMonth) / totalSalesLastMonth) * 100
        : 0
      const ticketChange = averageTicketYesterday > 0
        ? ((averageTicket - averageTicketYesterday) / averageTicketYesterday) * 100
        : 0

      // Produtos com estoque baixo
      const lowStockProducts = products.filter(p => 
        (p.stock_quantity || 0) <= (p.min_stock || 5)
      )

      // Produtos mais vendidos (corrigido - usando sale_items)
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

      const topProductsData = Object.values(productSalesMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      // Últimas vendas
      const recentSalesData = sales.slice(0, 5).map(sale => ({
        id: sale.id,
        sale_number: sale.sale_number,
        customer: sale.customer_name || 'Cliente não identificado',
        amount: sale.final_amount || 0,
        payment_method: sale.payment_method,
        status: sale.status || 'completed',
        date: sale.created_at
      }))

      // Configurar dados do gráfico
      setSalesChartData({
        labels: last7Days.map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
        datasets: [{
          label: 'Vendas (R$)',
          data: last7Days.map(d => salesByDay[d.toISOString().split('T')[0]] || 0),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      })

      setStats({
        salesToday: { 
          value: totalSalesToday, 
          change: Math.abs(salesChange), 
          trend: salesChange >= 0 ? 'up' : 'down' 
        },
        salesMonth: { 
          value: totalSalesMonth, 
          change: Math.abs(monthChange), 
          trend: monthChange >= 0 ? 'up' : 'down' 
        },
        products: { value: products.length },
        customers: { value: customersCount },
        averageTicket: { 
          value: averageTicket, 
          change: Math.abs(ticketChange), 
          trend: ticketChange >= 0 ? 'up' : 'down' 
        },
        lowStockProducts: { value: lowStockProducts.length }
      })

      setRecentSales(recentSalesData)
      setTopProducts(topProductsData)

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      setError('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      completed: { label: 'Concluída', variant: 'success' },
      pending: { label: 'Pendente', variant: 'warning' },
      cancelled: { label: 'Cancelada', variant: 'danger' }
    }
    const { label, variant } = config[status] || config.pending
    return <Badge variant={variant}>{label}</Badge>
  }

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: 'Dinheiro',
      credit: 'Crédito',
      debit: 'Débito',
      pix: 'PIX'
    }
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
        }
      }
    }
  }

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={4} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header com boas-vindas */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
              </h1>
              <p className="text-gray-600 mt-1">
                Bem-vindo ao seu painel de controle
              </p>
            </div>
            
            {/* Ações Rápidas */}
            <div className="flex gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Link key={index} to={action.path}>
                    <Button size="sm" variant="outline" icon={Icon}>
                      {action.label}
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="mb-4">
            <FeedbackMessage type="error" message={error} onClose={() => setError(null)} />
          </div>
        )}

        {/* Cards de Estatísticas - Usando SummaryCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SectionErrorBoundary title="Erro nas vendas de hoje">
            <SummaryCard
              title="Vendas Hoje"
              value={formatCurrency(stats.salesToday.value)}
              icon={ShoppingCart}
              color="blue"
              trend={stats.salesToday.trend === 'up' ? 'up' : 'down'}
              subtitle={`${stats.salesToday.change.toFixed(1)}% vs ontem`}
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro nas vendas do mês">
            <SummaryCard
              title="Vendas no Mês"
              value={formatCurrency(stats.salesMonth.value)}
              icon={TrendingUp}
              color="green"
              trend={stats.salesMonth.trend === 'up' ? 'up' : 'down'}
              subtitle={`${stats.salesMonth.change.toFixed(1)}% vs mês anterior`}
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro no ticket médio">
            <SummaryCard
              title="Ticket Médio"
              value={formatCurrency(stats.averageTicket.value)}
              icon={CreditCard}
              color="purple"
              trend={stats.averageTicket.trend === 'up' ? 'up' : 'down'}
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

        {/* Segunda linha de cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        {/* Gráfico de Vendas */}
        <SectionErrorBoundary title="Erro no gráfico de vendas">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Vendas dos Últimos 7 Dias</h2>
            <div className="h-64">
              <Line data={salesChartData} options={chartOptions} />
            </div>
          </div>
        </SectionErrorBoundary>

        {/* Últimas Vendas e Produtos Mais Vendidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionErrorBoundary title="Erro nas últimas vendas">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Últimas Vendas</h2>
                <Link 
                  to="/sales-list" 
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Ver todas <ChevronRight size={16} />
                </Link>
              </div>
              
              {recentSales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma venda registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">#{sale.sale_number}</p>
                          <p className="text-sm text-gray-600">{sale.customer}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">
                            {formatDate(sale.date)} • {getPaymentMethodLabel(sale.payment_method)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(sale.amount)}
                        </p>
                        {getStatusBadge(sale.status)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro nos produtos mais vendidos">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Produtos Mais Vendidos</h2>
                <Link 
                  to="/reports" 
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  Relatórios <ChevronRight size={16} />
                </Link>
              </div>
              
              {topProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma venda registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-700' :
                          index === 1 ? 'bg-gray-200 text-gray-600' :
                          index === 2 ? 'bg-amber-100 text-amber-700' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-gray-900">{formatNumber(product.quantity)}</span>
                        <p className="text-xs text-gray-500">unidades</p>
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