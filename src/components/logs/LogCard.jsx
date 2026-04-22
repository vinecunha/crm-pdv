import React from 'react'
import { Eye, ChevronRight } from '@lib/icons'

const LogCard = ({ log, onViewDetails, getActionColor, getActionLabel, formatDateCard }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-1 text-xs rounded-full ${getActionColor(log.action)}`}>
              {getActionLabel(log.action)}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateCard(log.created_at)}</span>
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
            {log.user_email || 'Sistema'}
            {log.user_role && (
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 capitalize">({log.user_role})</span>
            )}
          </p>
        </div>
        <button onClick={() => onViewDetails(log)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1">
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="space-y-1 text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
        <div className="flex justify-between">
          <span className="text-gray-500 dark:text-gray-400">Data/Hora:</span>
          <span className="text-gray-700 dark:text-gray-300">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
        </div>
        {log.entity_type && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">Entidade:</span>
            <span className="text-gray-700 dark:text-gray-300 capitalize">{log.entity_type}</span>
          </div>
        )}
        {log.ip_address && (
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">IP:</span>
            <span className="text-gray-700 dark:text-gray-300 font-mono text-xs">{log.ip_address}</span>
          </div>
        )}
      </div>
      
      <button
        onClick={() => onViewDetails(log)}
        className="w-full mt-3 py-2 bg-gray-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-sm flex items-center justify-center gap-2 transition-colors"
      >
        <Eye size={16} /> Ver detalhes
      </button>
    </div>
  )
}

export default LogCard