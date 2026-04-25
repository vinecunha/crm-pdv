import React from 'react'
import { Award, Trophy, Calendar, TrendingUp, Zap, Star } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const AchievementItem = ({ icon: Icon, title, value, subtitle, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/30',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30',
    green: 'bg-green-50 dark:bg-green-900/30',
    purple: 'bg-purple-50 dark:bg-purple-900/30'
  }
  
  return (
    <div className={`flex items-center gap-3 p-3 ${colors[color]} rounded-lg`}>
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
}

const SellerAchievements = ({ metrics }) => {
  // Calcular conquistas adicionais
  const achievements = []
  
  if (metrics.largestSale) {
    achievements.push({
      icon: Trophy,
      title: 'Maior Venda',
      value: formatCurrency(metrics.largestSale.amount),
      subtitle: `Venda #${metrics.largestSale.sale_number}`,
      color: 'yellow'
    })
  }
  
  if (metrics.bestDay) {
    achievements.push({
      icon: Calendar,
      title: 'Melhor Dia',
      value: formatCurrency(metrics.bestDay.value),
      subtitle: new Date(metrics.bestDay.date).toLocaleDateString('pt-BR'),
      color: 'green'
    })
  }
  
  achievements.push({
    icon: TrendingUp,
    title: 'Performance Score',
    value: Math.round(metrics.performanceScore || 0),
    subtitle: 'Pontos',
    color: 'blue'
  })
  
  // Conquistas baseadas em marcos
  if (metrics.totalSales >= 100) {
    achievements.push({
      icon: Star,
      title: '100+ Vendas',
      value: '🏆 Vendedor Destaque',
      subtitle: `${metrics.totalSales} vendas`,
      color: 'purple'
    })
  } else if (metrics.totalSales >= 50) {
    achievements.push({
      icon: Zap,
      title: '50+ Vendas',
      value: '⭐ Vendedor em Ascensão',
      subtitle: `${metrics.totalSales} vendas`,
      color: 'purple'
    })
  }
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Award className="text-blue-500" size={20} />
        Conquistas e Reconhecimentos
      </h2>
      
      <div className="space-y-3">
        {achievements.map((achievement, index) => (
          <AchievementItem key={index} {...achievement} />
        ))}
      </div>
      
      {/* Próxima conquista */}
      {metrics.totalSales < 50 && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🎯 Próxima conquista: <strong>50 vendas</strong> para se tornar Vendedor em Ascensão
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
            <div 
              className="bg-purple-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((metrics.totalSales / 50) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerAchievements
