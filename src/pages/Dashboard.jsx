import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  ShoppingCart, 
  UserPlus, 
  Plus, 
  Package,
  LayoutDashboard,
  ChevronRight
} from '../lib/icons'
import { useDashboardData } from '../hooks/useDashboardData'
import { useDashboardStats } from '../hooks/useDashboardStats'
import SectionErrorBoundary from '../components/SectionErrorBoundary'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import Button from '../components/ui/Button'
import PageHeader from '../components/ui/PageHeader'
import DashboardStats from '../components/dashboard/DashboardStats'
import SalesChart from '../components/dashboard/SalesChart'
import RecentSalesList from '../components/dashboard/RecentSalesList'
import TopProductsList from '../components/dashboard/TopProductsList'

const Dashboard = () => {
  const { profile, permissions } = useAuth()
  const { data: rawData, isLoading, error, refetch } = useDashboardData()
  const dashboardStats = useDashboardStats(rawData)

  // Ações rápidas baseadas em permissões
  const quickActions = useMemo(() => {
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
    
    return actions
  }, [permissions])

  // Loading state
  if (isLoading) {
    return <DataLoadingSkeleton type="dashboard" />
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Erro ao carregar dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <Button onClick={() => refetch()} icon={RefreshCw}>
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  if (!dashboardStats) return null

  const { recentSales, topProducts, chartData } = dashboardStats

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <PageHeader
          title={`Bem-vindo, ${profile?.full_name?.split(' ')[0] || 'Usuário'}!`}
          description="Acompanhe os principais indicadores do seu negócio"
          icon={LayoutDashboard}
          actions={quickActions.map(action => ({
            ...action,
            render: () => (
              <Link key={action.path} to={action.path}>
                <Button size="sm" variant="outline" icon={action.icon}>
                  <span className="hidden xs:inline">{action.label}</span>
                </Button>
              </Link>
            )
          }))}
        />

        {/* Cards de Estatísticas */}
        <DashboardStats 
          stats={dashboardStats}
          isLoading={isLoading}
          onRefresh={refetch}
        />

        {/* Gráfico de Vendas */}
        <div className='mt-6'>
          <SectionErrorBoundary title="Erro no gráfico de vendas">
            <SalesChart data={chartData} />
          </SectionErrorBoundary>
        </div>

        {/* Últimas Vendas e Produtos Mais Vendidos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Últimas Vendas */}
          <SectionErrorBoundary title="Erro nas últimas vendas">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Últimas Vendas
                </h2>
                <Link 
                  to="/sales-list" 
                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  Ver todas <ChevronRight size={16} />
                </Link>
              </div>
              
              <RecentSalesList sales={recentSales} />
            </div>
          </SectionErrorBoundary>

          {/* Produtos Mais Vendidos */}
          <SectionErrorBoundary title="Erro nos produtos mais vendidos">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  Produtos Mais Vendidos
                </h2>
                <Link 
                  to="/reports" 
                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  Relatórios <ChevronRight size={16} />
                </Link>
              </div>
              
              <TopProductsList products={topProducts} />
            </div>
          </SectionErrorBoundary>
        </div>
      </div>
    </div>
  )
}

export default Dashboard