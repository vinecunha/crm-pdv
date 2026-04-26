// src/components/commissions/CommissionHistory.jsx
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'
import Badge from '@components/ui/Badge'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import { Calendar, DollarSign, CheckCircle, Clock, Filter } from '@lib/icons'
import { formatCurrency } from '@utils/formatters'

const CommissionHistory = ({ userId }) => {
  const [period, setPeriod] = useState('all')
  
  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commission-history', userId, period],
    queryFn: async () => {
      let query = supabase
        .from('commissions')
        .select(`
          *,
          sale:sales(sale_number, final_amount, created_at)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (period !== 'all') {
        query = query.eq('period', period)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    enabled: !!userId
  })
  
  const periods = [
    { value: 'all', label: 'Todos' },
    { value: new Date().toISOString().slice(0, 7), label: 'Mês Atual' },
    { value: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7), label: 'Mês Passado' }
  ]
  
  const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0)
  const paidAmount = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0)
  const pendingAmount = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
  
  if (isLoading) return <DataLoadingSkeleton type="list" rows={5} />
  
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-blue-500" />
            Histórico de Comissões
          </h2>
          
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="text-sm px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Pago</p>
            <p className="font-semibold text-green-600 dark:text-green-400">
              {formatCurrency(paidAmount)}
            </p>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400">Pendente</p>
            <p className="font-semibold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(pendingAmount)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
        {commissions.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma comissão encontrada
          </p>
        ) : (
          commissions.map(commission => (
            <div key={commission.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
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
                      Venda #{commission.sale?.sale_number || commission.sale_id}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {commission.percentage}% • {commission.period}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(commission.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`font-semibold ${
                    commission.status === 'paid' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {formatCurrency(commission.amount)}
                  </p>
                  <Badge variant={commission.status === 'paid' ? 'success' : 'warning'} size="sm">
                    {commission.status === 'paid' ? 'Pago' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default CommissionHistory

