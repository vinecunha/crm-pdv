import React from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, TrendingUp, Award, ChevronRight, User } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const CommissionWidget = ({ summary, loading, userRole }) => {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    )
  }
  
  if (!summary) return null
  
  const { totalPending, pendingCount, totalPaid, topEarner, isGlobal } = summary
  const isAdminOrManager = userRole === 'admin' || userRole === 'gerente'
  
  return (
    <div className="space-y-3">
      {/* Card Principal - Pendente */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <DollarSign size={12} className="text-green-500" />
              {isGlobal ? 'Total Pendente' : 'Minha Comissão Pendente'}
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalPending)}
            </p>
            {pendingCount > 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {pendingCount} {pendingCount === 1 ? 'venda pendente' : 'vendas pendentes'}
              </p>
            )}
          </div>
          <div className="p-2 bg-green-100 dark:bg-green-800/30 rounded-full">
            <DollarSign size={20} className="text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>
      
      {/* Card Secundário - Pago (30 dias) */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
              <TrendingUp size={12} className="text-blue-500" />
              {isGlobal ? 'Total Pago (30d)' : 'Recebido (30d)'}
            </p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="p-2 bg-blue-100 dark:bg-blue-800/30 rounded-full">
            <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>
      
      {/* Top Earner (apenas para admin/gerente) */}
      {isGlobal && topEarner && (
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                <Award size={12} className="text-yellow-500" />
                Maior Comissão Pendente
              </p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                {formatCurrency(topEarner.amount)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                <User size={10} />
                {topEarner.name}
              </p>
            </div>
            <div className="p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded-full">
              <Award size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>
      )}
      
      {/* Link para página completa */}
      <Link
        to={isAdminOrManager ? '/commissions/admin' : `/sellers/${summary.userId}`}
        className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 pt-1 group"
      >
        <span>{isAdminOrManager ? 'Gerenciar comissões' : 'Ver detalhes'}</span>
        <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  )
}

export default CommissionWidget
