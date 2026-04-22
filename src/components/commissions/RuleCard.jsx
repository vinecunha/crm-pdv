// src/components/commissions/RuleCard.jsx
import React from 'react'
import Badge from '../Badge'
import Button from '../ui/Button'
import { Edit3, TrendingUp } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const RuleCard = ({ rule, onEdit, onToggle, canEdit }) => {
  const getPriorityLabel = (priority) => {
    if (priority <= 3) return 'Alta'
    if (priority <= 7) return 'Média'
    return 'Baixa'
  }
  
  const priorityColor = {
    'Alta': 'text-red-600 dark:text-red-400',
    'Média': 'text-yellow-600 dark:text-yellow-400',
    'Baixa': 'text-green-600 dark:text-green-400'
  }
  
  return (
    <div className={`
      bg-white dark:bg-gray-900 rounded-xl shadow-sm border transition-all duration-200
      ${rule.is_active 
        ? 'border-green-200 dark:border-green-800 hover:shadow-md' 
        : 'border-gray-200 dark:border-gray-700 opacity-60'
      } p-4
    `}>
      {/* Cabeçalho */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {rule.name}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {rule.description || 'Sem descrição'}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <Badge variant={rule.is_active ? 'success' : 'default'} size="sm">
            {rule.is_active ? 'Ativa' : 'Inativa'}
          </Badge>
        </div>
      </div>
      
      {/* Valor da Comissão */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
          {rule.percentage}%
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">de comissão</p>
      </div>
      
      {/* Detalhes */}
      <div className="space-y-1 mb-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Venda mínima:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(rule.min_sales || 0)}
          </span>
        </div>
        
        {rule.max_sales && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Venda máxima:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(rule.max_sales)}
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Prioridade:</span>
          <span className={`font-medium ${priorityColor[getPriorityLabel(rule.priority)]}`}>
            {getPriorityLabel(rule.priority)} ({rule.priority})
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {rule.rule_type === 'percentage' ? 'Percentual' : 'Fixo'}
          </span>
        </div>
      </div>
      
      {/* Ações */}
      {canEdit && (
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button
            size="sm"
            variant="outline"
            icon={Edit3}
            onClick={onEdit}
            fullWidth
          >
            Editar
          </Button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle?.(rule.id, !rule.is_active)
            }}
            className={`
              px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
              ${rule.is_active 
                ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' 
                : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
              }
            `}
          >
            {rule.is_active ? 'Desativar' : 'Ativar'}
          </button>
        </div>
      )}
      
      {/* Indicador de regra padrão */}
      {rule.priority === 10 && rule.name === 'Comissão Padrão' && (
        <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
          <TrendingUp size={12} />
          <span>Regra padrão do sistema</span>
        </div>
      )}
    </div>
  )
}

export default RuleCard