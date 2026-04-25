// src/components/dashboard/UserPerformanceCard.jsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Target, Award, ChevronRight } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const UserPerformanceCard = ({ sales, profile }) => {
  const navigate = useNavigate()
  
  // Calcular métricas do usuário
  const today = new Date()
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)
  
  const recentSales = sales.filter(s => new Date(s.created_at) >= thirtyDaysAgo)
  const totalSales = recentSales.reduce((sum, s) => sum + s.final_amount, 0)
  const salesCount = recentSales.length
  const averageTicket = salesCount > 0 ? totalSales / salesCount : 0
  
  // Meta diária
  const dailyGoal = 1000
  const todaySales = sales
    .filter(s => new Date(s.created_at).toDateString() === today.toDateString())
    .reduce((sum, s) => sum + s.final_amount, 0)
  const goalProgress = Math.min((todaySales / dailyGoal) * 100, 100)
  
  // Navegar para SellerDetail
  const handleViewDetails = () => {
    navigate(`/sellers/${profile.id}`)
  }
  
  return (
    <div 
      className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-blue-100 dark:border-blue-800 p-6 cursor-pointer hover:shadow-md transition-all group"
      onClick={handleViewDetails}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-blue-600 dark:text-blue-400" size={24} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Seu Desempenho
          </h3>
        </div>
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm">Ver detalhes</span>
          <ChevronRight size={18} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total de vendas */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Vendas (30 dias)
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalSales)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {salesCount} vendas realizadas
          </p>
        </div>
        
        {/* Ticket médio */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Ticket Médio
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(averageTicket)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Por venda
          </p>
        </div>
        
        {/* Meta do dia */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Meta do Dia
            </p>
            <Target className="text-green-500" size={16} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(todaySales)}
          </p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(goalProgress)}% da meta de {formatCurrency(dailyGoal)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Conquistas */}
      {salesCount >= 10 && (
        <div className="mt-4 flex items-center gap-2 text-sm">
          <Award className="text-yellow-500" size={18} />
          <span className="text-gray-700 dark:text-gray-300">
            {salesCount >= 50 ? '🏆 Vendedor Ouro' : salesCount >= 20 ? '🥈 Vendedor Prata' : '🥉 Vendedor Bronze'}
          </span>
        </div>
      )}
    </div>
  )
}

export default UserPerformanceCard
