// src/components/commissions/CommissionRuleBadge.jsx
import React from 'react'
import { Award, AlertCircle, Clock, TrendingUp } from '../../lib/icons'
import { formatDate } from '../../utils/formatters'

const CommissionRuleBadge = ({ rules, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
    )
  }
  
  if (!rules || rules.length === 0) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-800/30 rounded-full">
            <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Usando regras globais padrão
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
              Este vendedor não possui regras personalizadas.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  // Pegar a regra mais recente (pela data de associação)
  const latestRule = rules.sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  )[0]
  
  const hasMultipleRules = rules.length > 1
  const ruleNames = rules.map(r => r.rule?.name || 'Regra').join(', ')
  
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800 p-4">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-purple-100 dark:bg-purple-800/30 rounded-lg">
          <Award size={16} className="text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Regras de Comissão Personalizadas
        </h3>
        {hasMultipleRules && (
          <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-800/30 text-purple-700 dark:text-purple-300 rounded-full">
            {rules.length} regras
          </span>
        )}
      </div>
      
      {/* Lista de regras */}
      <div className="space-y-2 mb-3">
        {rules.map((userRule) => (
          <div 
            key={userRule.id} 
            className="flex items-center justify-between p-2.5 bg-white dark:bg-gray-800 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-green-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {userRule.rule?.name || 'Regra'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {userRule.rule?.percentage}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                min: R$ {userRule.rule?.min_sales || 0}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Informação de quando foi alterado */}
      {latestRule && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-2">
          <Clock size={12} />
          <span>
            Configurado em {formatDate(latestRule.created_at)}
            {latestRule.created_by_name && ` por ${latestRule.created_by_name}`}
          </span>
        </div>
      )}
      
      {/* Alerta importante */}
      <div className="flex items-start gap-2 p-2.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
        <AlertCircle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Importante:</strong> Alterações nas regras afetam apenas 
          <strong> vendas futuras</strong>. Comissões já registradas não serão modificadas.
        </p>
      </div>
    </div>
  )
}

export default CommissionRuleBadge