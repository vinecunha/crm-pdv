// src/pages/Dashboard.tsx
import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@contexts/AuthContext'
import { 
  ShoppingCart, 
  UserPlus, 
  Plus, 
  Package,
  LayoutDashboard,
  ChevronRight,
  RefreshCw,
  TrendingUp,
  Users,
  ClipboardList,
  BarChart3,
  ListChecks,
  DollarSign,
  Target
} from '@lib/icons'
import { useDashboard } from '@hooks/dashboard/useDashboard'
import SectionErrorBoundary from '@components/SectionErrorBoundary'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import TaskWidget from '@components/tasks/TaskWidget'
import { useTasksQuery } from '@hooks/tasks/useTasksQuery'
import Button from '@components/ui/Button'
import PageHeader from '@components/ui/PageHeader'
import DashboardStats from '@components/dashboard/DashboardStats'
import SalesChart from '@components/dashboard/SalesChart'
import RecentSalesList from '@components/dashboard/RecentSalesList'
import TopProductsList from '@components/dashboard/TopProductsList'
import TeamOverview from '@components/dashboard/TeamOverview'
import UserPerformanceCard from '@components/dashboard/UserPerformanceCard'
import CommissionWidget from '@components/commissions/CommissionWidget'
import { useCommissionSummary } from '@hooks/commissions/useCommissionSummary'
import { useDashboardRealtime } from '@hooks/dashboard/useDashboardRealtime'
import { useWelcomeMessage } from '@hooks/system/useWelcomeMessage'

const Dashboard = () => {
  const { profile, permissions } = useAuth()
  const navigate = useNavigate()
  const { 
    rawData,
    primaryStats,
    secondaryStats,
    recentSales,
    topProducts,
    chartData,
    isLoading,
    error,
    refetch,
    hasData
  } = useDashboard()

  useDashboardRealtime(!isLoading && !error)

  const { data: commissionSummary, isLoading: commissionLoading } = useCommissionSummary(
    profile?.id, 
    profile?.role
  )
  
  const isAdminOrManager = profile?.role === 'admin' || profile?.role === 'gerente'

  // Usar o hook existente
  const welcomeData = useWelcomeMessage()

  // Descrição baseada no perfil (não duplica o hook)
  const roleDescription = useMemo(() => {
    const descriptions: Record<string, string> = {
      admin: 'Visão geral completa do sistema',
      gerente: 'Gerencie sua equipe e acompanhe os resultados',
      operador: 'Acompanhe seu desempenho individual'
    }
    return descriptions[profile?.role || 'operador'] || 'Visão geral do sistema'
  }, [profile?.role])

  const quickActions = useMemo(() => {
    const actions = []
    
    if (permissions.canViewSales) {
      actions.push({ 
        label: 'Nova Venda', 
        icon: ShoppingCart, 
        onClick: () => navigate('/sales'),
        variant: 'primary'
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

  const { data: myTasks = [], isLoading: myTasksLoading } = useTasksQuery({
    assignedTo: profile?.id,
    status: 'pending',
    limit: 10
  })
  
  const { data: teamTasks = [], isLoading: teamTasksLoading } = useTasksQuery({
    type: 'team',
    status: 'pending',
    limit: 10
  })
  
  const tasksLoading = myTasksLoading || teamTasksLoading

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

  const teamData = rawData?.teamData
  const showTeamSection = profile?.role !== 'operador' && teamData

  const dashboardStats = {
    primaryStats,
    secondaryStats,
    recentSales,
    topProducts,
    chartData,
    hasData
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        
        {/* ============================================= */}
        {/* CABEÇALHO - Usando hook existente */}
        {/* ============================================= */}
        <PageHeader
          title={welcomeData.fullWelcome}
          description={roleDescription}
          subtitle={`${welcomeData.roleLabel} • ${new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
          })}`}
          icon={LayoutDashboard}
          actions={quickActions}
        />

        {/* Resto do conteúdo permanece igual... */}
        {/* ============================================= */}
        {/* SEÇÃO 1: MÉTRICAS PRINCIPAIS (KPIs) */}
        {/* ============================================= */}
        <section className="mb-6">
          <DashboardStats 
            stats={dashboardStats}
            isLoading={isLoading}
            onRefresh={refetch}
          />
        </section>

        {/* ============================================= */}
        {/* SEÇÃO 2: DESEMPENHO INDIVIDUAL (APENAS OPERADORES) */}
        {/* ============================================= */}
        {profile?.role === 'operador' && (
        <section className="mb-6">
          <SectionErrorBoundary title="Erro nas metas pessoais">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <UserPerformanceCard 
                sales={rawData?.sales || []} 
                profile={profile} 
              />
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-green-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Metas do Período
                  </h3>
                </div>
              </div>
            </div>
          </SectionErrorBoundary>
        </section>
      )}

        {/* ============================================= */}
        {/* SEÇÃO: GRID PRINCIPAL (GRÁFICO + WIDGETS) */}
        {/* ============================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          
          <div className="lg:col-span-2">
            <SectionErrorBoundary title="Erro no gráfico de vendas">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={18} className="text-blue-500" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    Evolução de Vendas (7 dias)
                  </h2>
                </div>
                <SalesChart data={chartData} />
              </div>
            </SectionErrorBoundary>
          </div>
          
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            
            <SectionErrorBoundary title="Erro no widget de comissões">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign size={18} className="text-green-500" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {isAdminOrManager ? 'Comissões' : 'Minhas Comissões'}
                  </h2>
                </div>
                <CommissionWidget 
                  summary={commissionSummary} 
                  loading={commissionLoading}
                  userRole={profile?.role}
                />
              </div>
            </SectionErrorBoundary>
            
            <SectionErrorBoundary title="Erro no widget de tarefas">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardList size={18} className="text-orange-500" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    Tarefas Pendentes
                  </h2>
                </div>
                <TaskWidget 
                  myTasks={myTasks}
                  teamTasks={teamTasks}
                  loading={tasksLoading}
                  maxItems={3}
                  defaultTab="my"
                />
              </div>
            </SectionErrorBoundary>
            
          </div>
        </div>

        {/* ============================================= */}
        {/* SEÇÃO 4: LISTAS (ÚLTIMAS VENDAS + PRODUTOS) */}
        {/* ============================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
          
          <SectionErrorBoundary title="Erro nas últimas vendas">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-blue-500" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {profile?.role === 'operador' ? 'Minhas Últimas Vendas' : 'Últimas Vendas'}
                  </h2>
                </div>
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
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Package size={18} className="text-purple-500" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    Produtos Mais Vendidos
                  </h2>
                </div>
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

        {/* ============================================= */}
        {/* SEÇÃO 5: EQUIPE (APENAS GERENTES E ADMINS) */}
        {/* ============================================= */}
        {showTeamSection && (
          <section>
            <SectionErrorBoundary title="Erro na visão da equipe">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-3 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={18} className="text-orange-500" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    Desempenho da Equipe
                  </h2>
                </div>
                <TeamOverview teamData={teamData} userRole={profile?.role} />
              </div>
            </SectionErrorBoundary>
          </section>
        )}
      </div>
    </div>
  )
}

export default Dashboard