import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useSellerData } from '../hooks/useSellerData'
import { useGoals } from '../hooks/useGoals'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import Button from '../components/ui/Button'
import GoalSettings from '../components/goals/GoalSettings'
import { 
  TrendingUp, 
  Target, 
  Award, 
  Calendar, 
  CreditCard,
  Users as UsersIcon,
  Package,
  ArrowLeft,
  Trophy,
  DollarSign,
  Settings
} from '../lib/icons'
import { formatCurrency, formatDate } from '../utils/formatters'

const SellerDetail = () => {
  const { sellerId } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [showGoalSettings, setShowGoalSettings] = useState(false)
  
  const { data, isLoading, error } = useSellerData(sellerId, profile?.role)
  const { goals, saveGoals, isSaving } = useGoals(sellerId)
  
  // Verificar permissão para editar metas
  const canEditGoals = profile?.role === 'admin' || profile?.role === 'gerente'
  
  if (isLoading) return <DataLoadingSkeleton type="detail" />
  
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Erro ao carregar dados
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error?.message || 'Vendedor não encontrado'}
          </p>
          <Button onClick={() => navigate(-1)} icon={ArrowLeft}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }
  
  const { profile: seller, metrics, topProducts } = data
  
  // Usar metas do banco ou fallback
  const dailyGoal = goals?.daily?.target_amount || 1000
  const monthlyGoal = goals?.monthly?.target_amount || 20000
  const yearlyGoal = goals?.yearly?.target_amount || 240000
  
  const handleSaveGoals = async (newGoals) => {
    await saveGoals({ 
      goals: newGoals, 
      createdBy: profile?.id 
    })
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate(-1)} icon={ArrowLeft} className="mb-4">
            Voltar
          </Button>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {seller.full_name?.charAt(0) || seller.email?.charAt(0) || 'V'}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {seller.full_name || 'Vendedor'}
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400">{seller.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      seller.role === 'operador' 
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                    }`}>
                      {seller.role}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Desde {formatDate(seller.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Botão de configurar metas */}
              {canEditGoals && (
                <Button
                  variant="outline"
                  icon={Settings}
                  onClick={() => setShowGoalSettings(true)}
                >
                  Configurar Metas
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Métricas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Total de Vendas"
            value={metrics.totalSales}
            icon={Target}
            color="blue"
          />
          <MetricCard
            title="Faturamento Total"
            value={formatCurrency(metrics.totalRevenue)}
            icon={DollarSign}
            color="green"
          />
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(metrics.averageTicket)}
            icon={CreditCard}
            color="purple"
          />
          <MetricCard
            title="Clientes Atendidos"
            value={data.customersServed.length}
            icon={UsersIcon}
            color="orange"
          />
        </div>
        
        {/* Metas e Progresso */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Trophy className="text-yellow-500" size={20} />
                Metas e Progresso
              </h2>
              {canEditGoals && (
                <button
                  onClick={() => setShowGoalSettings(true)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Editar
                </button>
              )}
            </div>
            <div className="space-y-4">
              <GoalProgress 
                label="Meta Diária" 
                current={metrics.revenueLast30Days / 30} 
                goal={dailyGoal}
                color="green"
              />
              <GoalProgress 
                label="Meta Mensal" 
                current={metrics.revenueLast30Days} 
                goal={monthlyGoal}
                color="blue"
              />
              <GoalProgress 
                label="Meta Anual" 
                current={metrics.revenueThisYear} 
                goal={yearlyGoal}
                color="purple"
              />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Award className="text-blue-500" size={20} />
              Conquistas
            </h2>
            <div className="space-y-3">
              {metrics.largestSale && (
                <AchievementItem
                  icon={Trophy}
                  title="Maior Venda"
                  value={formatCurrency(metrics.largestSale.amount)}
                  subtitle={`Venda #${metrics.largestSale.sale_number}`}
                />
              )}
              {metrics.bestDay && (
                <AchievementItem
                  icon={Calendar}
                  title="Melhor Dia"
                  value={formatCurrency(metrics.bestDay.value)}
                  subtitle={new Date(metrics.bestDay.date).toLocaleDateString('pt-BR')}
                />
              )}
              <AchievementItem
                icon={TrendingUp}
                title="Performance Score"
                value={Math.round(metrics.performanceScore)}
                subtitle="Pontos"
              />
            </div>
          </div>
        </div>
        
        {/* Produtos Mais Vendidos */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Package size={20} />
            Produtos Mais Vendidos
          </h2>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-6">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {product.salesCount} vendas
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {product.quantity} un
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {formatCurrency(product.revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Modal de configuração de metas */}
      <GoalSettings
        isOpen={showGoalSettings}
        onClose={() => setShowGoalSettings(false)}
        currentGoals={goals}
        onSave={handleSaveGoals}
        isSaving={isSaving}
        userName={seller.full_name || seller.email}
      />
    </div>
  )
}

// Subcomponentes (mantidos iguais)
const MetricCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}

const GoalProgress = ({ label, current, goal, color }) => {
  const progress = Math.min((current / goal) * 100, 100)
  
  const colors = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500'
  }
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {formatCurrency(current)} / {formatCurrency(goal)}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className={`${colors[color]} h-2 rounded-full transition-all`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
        {Math.round(progress)}% concluído
      </p>
    </div>
  )
}

const AchievementItem = ({ icon: Icon, title, value, subtitle }) => (
  <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div className="p-2 bg-white dark:bg-gray-700 rounded-full">
      <Icon size={18} className="text-gray-600 dark:text-gray-400" />
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
    <span className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>
  </div>
)

export default SellerDetail