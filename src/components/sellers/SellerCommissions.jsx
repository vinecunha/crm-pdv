// src/components/sellers/SellerCommissions.jsx
import React, { useState } from 'react'
import { DollarSign, TrendingUp, Calendar, CheckCircle, Clock, ChevronRight } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const SellerCommissions = ({ commissions, isLoading }) => {
  const [showHistory, setShowHistory] = useState(false)
  
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </div>
    )
  }
  
  if (!commissions) return null
  
  const { summary = {}, history = [] } = commissions
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <DollarSign className="text-green-500" size={20} />
          Comissões
        </h2>
      </div>
      
      {/* Resumo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mês Atual</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.current_month || 0)}
            </p>
            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
              <TrendingUp size={12} />
              <span>a receber</span>
            </div>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pendente</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(summary.total_pending || 0)}
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Pago</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(summary.total_paid || 0)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Histórico */}
      <div className="p-6">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Histórico de Comissões
          </span>
          <ChevronRight size={16} className={`text-gray-400 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
        </button>
        
        {showHistory && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Nenhuma comissão registrada
              </p>
            ) : (
              history.map(commission => (
                <div
                  key={commission.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      commission.status === 'paid' 
                        ? 'bg-green-100 dark:bg-green-900/30' 
                        : 'bg-yellow-100 dark:bg-yellow-900/30'
                    }`}>
                      {commission.status === 'paid' 
                        ? <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                        : <Clock size={14} className="text-yellow-600 dark:text-yellow-400" />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Venda #{commission.sale_id}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {commission.percentage}% • {commission.period}
                      </p>
                    </div>
                  </div>
                  <p className={`font-semibold ${
                    commission.status === 'paid' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {formatCurrency(commission.amount)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerCommissions
