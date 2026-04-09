// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Users, ShoppingCart, Package, TrendingUp, ArrowUp, ArrowDown, Loader } from 'lucide-react'
import { formatCurrency, formatNumber } from '../utils/formatters'
import SectionErrorBoundary from '../components/SectionErrorBoundary'

const Dashboard = () => {
  const { profile, isAdmin, permissions } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    salesToday: { value: 0, change: 0, trend: 'up' },
    salesMonth: { value: 0, change: 0, trend: 'up' },
    products: { value: 0, change: 0, trend: 'up' },
    customers: { value: 0, change: 0, trend: 'up' },
    averageTicket: { value: 0, change: 0, trend: 'up' },
    pendingOrders: { value: 0 },
    lowStockProducts: { value: 0 }
  })
  const [recentSales, setRecentSales] = useState([])
  const [topProducts, setTopProducts] = useState([])

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      console.log('=== Carregando Dashboard ===')

      // Buscar clientes - com tratamento de erro específico
      let customersCount = 0
      try {
        const { data: customers, error: customersError, count } = await supabase
          .from('customers')
          .select('*', { count: 'exact', head: true })

        if (customersError) {
          console.error('Erro ao buscar clientes:', customersError)
          // Se der erro, tenta buscar sem count
          const { data: customersData, error: error2 } = await supabase
            .from('customers')
            .select('id')
          
          if (!error2 && customersData) {
            customersCount = customersData.length
            console.log(`✅ Clientes encontrados (fallback): ${customersCount}`)
          }
        } else {
          customersCount = count || 0
          console.log(`✅ Clientes encontrados: ${customersCount}`)
        }
      } catch (err) {
        console.error('Erro exceção ao buscar clientes:', err)
      }

      // Buscar vendas
      let sales = []
      try {
        const { data, error: salesError } = await supabase
          .from('sales')
          .select('*')
          .order('created_at', { ascending: false })

        if (salesError) {
          console.error('Erro ao buscar vendas:', salesError)
        } else {
          sales = data || []
          console.log(`✅ Vendas encontradas: ${sales.length}`)
        }
      } catch (err) {
        console.error('Erro exceção ao buscar vendas:', err)
      }

      // Buscar produtos
      let products = []
      try {
        const { data, error: productsError } = await supabase
          .from('products')
          .select('*')

        if (productsError) {
          console.error('Erro ao buscar produtos:', productsError)
        } else {
          products = data || []
          console.log(`✅ Produtos encontrados: ${products.length}`)
        }
      } catch (err) {
        console.error('Erro exceção ao buscar produtos:', err)
      }

      // Calcular estatísticas (com proteção contra dados vazios)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

      // Vendas de hoje
      const salesToday = sales?.filter(sale => new Date(sale.created_at) >= today) || []
      const totalSalesToday = salesToday.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

      // Vendas de ontem
      const salesYesterday = sales?.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= yesterday && saleDate < today
      }) || []
      const totalSalesYesterday = salesYesterday.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

      // Vendas do mês
      const salesThisMonth = sales?.filter(sale => new Date(sale.created_at) >= startOfMonth) || []
      const totalSalesMonth = salesThisMonth.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

      // Vendas do mês passado
      const salesLastMonth = sales?.filter(sale => {
        const saleDate = new Date(sale.created_at)
        return saleDate >= startOfLastMonth && saleDate <= endOfLastMonth
      }) || []
      const totalSalesLastMonth = salesLastMonth.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)

      // Calcular ticket médio
      const averageTicket = salesToday.length > 0 ? totalSalesToday / salesToday.length : 0
      const averageTicketYesterday = salesYesterday.length > 0 ? totalSalesYesterday / salesYesterday.length : 0

      // Calcular mudanças percentuais
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
      const lowStockProducts = products?.filter(p => (p.stock || 0) <= (p.min_stock || 5)) || []

      // Últimas vendas
      const recentSalesData = sales?.slice(0, 5).map(sale => ({
        id: sale.id,
        customer: sale.customer_name || 'Cliente não identificado',
        amount: sale.total_amount || 0,
        status: sale.status || 'completed',
        date: sale.created_at
      })) || []

      // Produtos mais vendidos
      const productSales = {}
      sales?.forEach(sale => {
        if (sale.items && Array.isArray(sale.items)) {
          sale.items.forEach(item => {
            if (productSales[item.product_name]) {
              productSales[item.product_name] += item.quantity || 0
            } else {
              productSales[item.product_name] = item.quantity || 0
            }
          })
        }
      })

      const topProductsData = Object.entries(productSales)
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

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
        products: { 
          value: products?.length || 0, 
          change: 0, 
          trend: 'up' 
        },
        customers: { 
          value: customersCount, // Usando a contagem correta
          change: 0, 
          trend: 'up' 
        },
        averageTicket: { 
          value: averageTicket, 
          change: Math.abs(ticketChange), 
          trend: ticketChange >= 0 ? 'up' : 'down' 
        },
        pendingOrders: { 
          value: sales?.filter(s => s.status === 'pending').length || 0 
        },
        lowStockProducts: { 
          value: lowStockProducts.length 
        }
      })

      setRecentSales(recentSalesData)
      setTopProducts(topProductsData)

      // Log final para debug
      console.log('=== Dashboard carregado ===')
      console.log(`Clientes: ${customersCount}`)
      console.log(`Produtos: ${products?.length || 0}`)
      console.log(`Vendas: ${sales?.length || 0}`)

    } catch (error) {
      console.error('Erro geral ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, change, trend, prefix = '' }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {prefix}{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          {change !== undefined && change > 0 && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <ArrowUp className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {change.toFixed(1)}%
              </span>
              <span className="text-xs text-gray-400">vs período anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full bg-${color}-50`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  )

  const getStatusBadge = (status) => {
    const config = {
      completed: { label: 'Concluída', class: 'bg-green-100 text-green-800' },
      pending: { label: 'Pendente', class: 'bg-yellow-100 text-yellow-800' },
      cancelled: { label: 'Cancelada', class: 'bg-red-100 text-red-800' }
    }
    const { label, class: className } = config[status] || config.pending
    return <span className={`px-2 py-1 text-xs rounded-full ${className}`}>{label}</span>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas - Cada card é isolado com ErrorBoundary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <SectionErrorBoundary title="Erro nas vendas de hoje" message="Não foi possível carregar as vendas do dia.">
            <StatCard
              title="Vendas Hoje"
              value={stats.salesToday.value}
              icon={ShoppingCart}
              color="blue"
              change={stats.salesToday.change}
              trend={stats.salesToday.trend}
              prefix="R$ "
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro nas vendas do mês" message="Não foi possível carregar as vendas mensais.">
            <StatCard
              title="Vendas no Mês"
              value={stats.salesMonth.value}
              icon={TrendingUp}
              color="green"
              change={stats.salesMonth.change}
              trend={stats.salesMonth.trend}
              prefix="R$ "
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro no ticket médio" message="Não foi possível calcular o ticket médio.">
            <StatCard
              title="Ticket Médio"
              value={stats.averageTicket.value}
              icon={ShoppingCart}
              color="orange"
              change={stats.averageTicket.change}
              trend={stats.averageTicket.trend}
              prefix="R$ "
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro nos produtos" message="Não foi possível carregar os produtos.">
            <StatCard
              title="Produtos"
              value={stats.products.value}
              icon={Package}
              color="purple"
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro nos clientes" message="Não foi possível carregar os clientes.">
            <StatCard
              title="Clientes"
              value={stats.customers.value}
              icon={Users}
              color="indigo"
            />
          </SectionErrorBoundary>

          <SectionErrorBoundary title="Erro nas pendências" message="Não foi possível carregar as pendências.">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pendências</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingOrders.value}</p>
                  <p className="text-xs text-gray-400 mt-1">Pedidos pendentes</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-50">
                  <ShoppingCart className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              {stats.lowStockProducts.value > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-red-600">
                    ⚠️ {stats.lowStockProducts.value} produtos com estoque baixo
                  </p>
                </div>
              )}
            </div>
          </SectionErrorBoundary>
        </div>

        {/* Gráficos e Tabelas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Últimas Vendas */}
          <SectionErrorBoundary title="Erro nas últimas vendas" message="Não foi possível carregar as últimas vendas.">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Últimas Vendas</h2>
              {recentSales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma venda registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentSales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{sale.customer}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(sale.date).toLocaleDateString('pt-BR')}
                        </p>
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

          {/* Produtos Mais Vendidos */}
          <SectionErrorBoundary title="Erro nos produtos mais vendidos" message="Não foi possível carregar os produtos mais vendidos.">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h2>
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
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
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

        {/* Permissões por Cargo */}
        <SectionErrorBoundary title="Erro nas permissões" message="Não foi possível carregar as informações de permissões.">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Ações Disponíveis por Cargo
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {profile?.role === 'admin' && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">👑</span>
                    <h3 className="font-semibold text-purple-900">Administrador</h3>
                  </div>
                  <p className="text-sm text-purple-700">
                    • Gerenciar usuários<br />
                    • Configurações do sistema<br />
                    • Visualizar todos os logs<br />
                    • Backup e manutenção<br />
                    • Alterar permissões
                  </p>
                </div>
              )}
              
              {(profile?.role === 'admin' || profile?.role === 'gerente') && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">📊</span>
                    <h3 className="font-semibold text-blue-900">Gerente</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    • Relatórios gerenciais<br />
                    • Gestão de funcionários<br />
                    • Metas e comissões<br />
                    • Análise de vendas<br />
                    • Controle de estoque
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💼</span>
                  <h3 className="font-semibold text-green-900">Operador</h3>
                </div>
                <p className="text-sm text-green-700">
                  • Ponto de venda (PDV)<br />
                  • Cadastro de clientes<br />
                  • Registrar vendas<br />
                  • Consultar produtos<br />
                  • Emitir comprovantes
                </p>
              </div>
            </div>
          </div>
        </SectionErrorBoundary>
      </main>
    </div>
  )
}

export default Dashboard