import React from 'react'
import { Trophy, TrendingUp, Target, Award } from '../../lib/icons'
import { formatCurrency } from '../../utils/formatters'

const GoalProgress = ({ label, current, goal, color, icon: Icon }) => {
  const progress = Math.min((current / goal) * 100, 100)
  
  const colors = {
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600 dark:text-green-400',
      light: 'bg-green-50 dark:bg-green-900/30'
    },
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      light: 'bg-blue-50 dark:bg-blue-900/30'
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-600 dark:text-purple-400',
      light: 'bg-purple-50 dark:bg-purple-900/30'
    }
  }
  
  const colorSet = colors[color]
  const isAchieved = progress >= 100
  
  return (
    <div className={`p-4 rounded-xl transition-all ${isAchieved ? colorSet.light : 'bg-gray-50 dark:bg-gray-800/50'}`}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={18} className={colorSet.text} />}
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        {isAchieved && (
          <span className="ml-auto text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full flex items-center gap-1">
            <Award size={12} />
            Atingida!
          </span>
        )}
      </div>
      
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 dark:text-gray-400">Progresso</span>
        <span className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(current)} / {formatCurrency(goal)}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
        <div 
          className={`${colorSet.bg} h-3 rounded-full transition-all duration-500 relative`}
          style={{ width: `${progress}%` }}
        >
          {progress > 15 && (
            <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] text-white font-medium">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {progress >= 100 
            ? '🎉 Meta batida!' 
            : `Faltam ${formatCurrency(goal - current)}`
          }
        </p>
        <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
          {progress >= 100 ? '100%' : `${Math.round(progress)}%`}
        </p>
      </div>
    </div>
  )
}

const SellerGoalsSection = ({ metrics, goals, canEditGoals, onEditGoals }) => {
  const dailyGoal = goals?.daily?.target_amount || 1000
  const monthlyGoal = goals?.monthly?.target_amount || 20000
  const yearlyGoal = goals?.yearly?.target_amount || 240000
  
  // Calcular médias e projeções
  const dailyAverage = metrics.revenueLast30Days / 30
  const monthlyProjection = dailyAverage * 30
  const yearlyProjection = dailyAverage * 365
  
  // Verificar quais metas foram atingidas
  const dailyAchieved = dailyAverage >= dailyGoal
  const monthlyAchieved = metrics.revenueLast30Days >= monthlyGoal
  const yearlyAchieved = metrics.revenueThisYear >= yearlyGoal
  
  const achievedCount = [dailyAchieved, monthlyAchieved, yearlyAchieved].filter(Boolean).length
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
            <Trophy className="text-yellow-600 dark:text-yellow-400" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Metas e Progresso
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {achievedCount} de 3 metas atingidas
            </p>
          </div>
        </div>
        
        {canEditGoals && (
          <button
            onClick={onEditGoals}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Target size={14} />
            Editar Metas
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        <GoalProgress 
          label="Meta Diária (média)" 
          current={dailyAverage} 
          goal={dailyGoal}
          color="green"
          icon={TrendingUp}
        />
        
        <GoalProgress 
          label="Meta Mensal" 
          current={metrics.revenueLast30Days} 
          goal={monthlyGoal}
          color="blue"
          icon={Target}
        />
        
        <GoalProgress 
          label="Meta Anual" 
          current={metrics.revenueThisYear} 
          goal={yearlyGoal}
          color="purple"
          icon={Trophy}
        />
      </div>
      
      {/* Projeções e insights */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-gray-500" />
          Projeções e Insights
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Projeção Mensal</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(monthlyProjection)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {monthlyProjection >= monthlyGoal ? '✅ Acima da meta' : '📈 Abaixo da meta'}
            </p>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Média Diária</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(dailyAverage)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Meta: {formatCurrency(dailyGoal)}/dia
            </p>
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dias para Meta Mensal</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {dailyAverage > 0 
                ? Math.ceil((monthlyGoal - metrics.revenueLast30Days) / dailyAverage)
                : '—'
              } dias
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              No ritmo atual
            </p>
          </div>
        </div>
        
        {/* Mensagem motivacional */}
        {achievedCount === 3 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center gap-2">
              <Trophy size={16} />
              <strong>Incrível!</strong> Todas as metas foram atingidas! 🎉
            </p>
          </div>
        )}
        
        {achievedCount === 0 && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💪 Continue assim! Cada venda te aproxima das metas!
            </p>
          </div>
        )}
      </div>
      
      {/* Resumo de vendas */}
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.salesLast30Days}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vendas (30d)</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {metrics.totalSales}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total de vendas</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(metrics.averageTicket).replace('R$', '')}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ticket médio</p>
        </div>
      </div>
    </div>
  )
}

export default SellerGoalsSection