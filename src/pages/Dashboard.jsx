import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  ShoppingCart, 
  UserPlus, 
  Plus, 
  Package,
  LayoutDashboard,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Users
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
import TeamOverview from '../components/dashboard/TeamOverview'
import UserPerformanceCard from '../components/dashboard/UserPerformanceCard'

const Dashboard = () => {
  const { profile, permissions } = useAuth()
  const navigate = useNavigate()
  const { data: rawData, isLoading, error, refetch } = useDashboardData()
  const dashboardStats = useDashboardStats(rawData)

  const quickActions = useMemo(() => {
    const actions = []
    
    if (permissions.canViewSales) {
      actions.push({ 
        label: 'Nova Venda', 
        icon: ShoppingCart, 
        onClick: () => navigate('/sales'),
        variant: 'outline'
      })
    }
    if (permissions.canViewCustomers) {
      actions.push({ 
        label: 'Novo Cliente', 
        icon: UserPlus, 
        onClick: () => navigate('/customers'),
        variant: 'outline'
      })
    }
    if (permissions.canViewProducts) {
      actions.push({ 
        label: 'Novo Produto', 
        icon: Plus, 
        onClick: () => navigate('/products'),
        variant: 'outline'
      })
    }
    if (permissions.canManageStock) {
      actions.push({ 
        label: 'Balanço', 
        icon: Package, 
        onClick: () => navigate('/stock-count'),
        variant: 'outline'
      })
    }
    
    return actions
  }, [permissions, navigate])

  // Determinar título baseado no cargo
  const getWelcomeTitle = () => {
    const firstName = profile?.full_name?.split(' ')[0] || 'Usuário'
    const roleEmoji = profile?.role === 'admin' ? '👑' : profile?.role === 'gerente' ? '📊' : '💼'
    return `${roleEmoji} Bem-vindo, ${firstName}!`
  }

  if (isLoading) {
    return <DataLoadingSkeleton type="dashboard" />
  }

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
  const { teamData } = rawData || {}
  const showTeamSection = profile?.role !== 'operador' && teamData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <PageHeader
          title={getWelcomeTitle()}
          description={
            profile?.role === 'operador' 
              ? 'Acompanhe seu desempenho individual'
              : profile?.role === 'gerente'
                ? 'Gerencie sua equipe e acompanhe os resultados'
                : 'Visão geral completa do sistema'
          }
          icon={LayoutDashboard}
          actions={quickActions}
        />

        {/* Card de desempenho do usuário (para operadores) */}
        {profile?.role === 'operador' && (
          <div className="mb-6">
            <UserPerformanceCard 
              sales={rawData?.sales || []} 
              profile={profile} 
            />
          </div>
        )}

        <DashboardStats 
          stats={dashboardStats}
          isLoading={isLoading}
          onRefresh={refetch}
        />

        <div className='mt-6'>
          <SectionErrorBoundary title="Erro no gráfico de vendas">
            <SalesChart data={chartData} />
          </SectionErrorBoundary>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <SectionErrorBoundary title="Erro nas últimas vendas">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-6">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                  {profile?.role === 'operador' ? 'Minhas Últimas Vendas' : 'Últimas Vendas'}
                </h2>
                <Link 
                  to="/sales-list" 
                  className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                  Ver todas <ChevronRight size={16} />
                </Link>
              </div>
              
              <RecentSalesList sales={recentSales} showSeller={profile?.role !== 'operador'} />
            </div>
          </SectionErrorBoundary>

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

        {/* Seção da Equipe (Gerentes e Admins) */}
        {showTeamSection && (
          <div className="mt-6">
            <TeamOverview teamData={teamData} userRole={profile?.role} />
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard