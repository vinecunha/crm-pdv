// src/components/cashier/CashierFilters.jsx - Versão mobile-first
import React from 'react'
import { RefreshCw, Calendar, Users } from '@lib/icons'
import Button from '@components/ui/Button'

const CashierFilters = ({ 
  dateRange, 
  setDateRange, 
  selectedUser, 
  setSelectedUser, 
  users, 
  onRefresh, 
  loading 
}) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4 sm:mb-6">
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        {/* Data Inicial */}
        <div className="flex-1 min-w-[120px]">
          <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            <Calendar size={12} />
            Início
          </label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg"
          />
        </div>
        
        {/* Data Final */}
        <div className="flex-1 min-w-[120px]">
          <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            <Calendar size={12} />
            Fim
          </label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg"
          />
        </div>
        
        {/* Operador */}
        <div className="flex-[2] min-w-[150px]">
          <label className="flex items-center gap-1 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
            <Users size={12} />
            Operador
          </label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg"
          >
            <option value="all">Todos</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.full_name?.split(' ')[0] || user.email}
              </option>
            ))}
          </select>
        </div>
        
        {/* Botão Atualizar */}
        <Button 
          onClick={onRefresh} 
          loading={loading} 
          variant="primary"
          icon={RefreshCw}
          size="sm"
          className="sm:mb-0"
        >
          <span className="hidden sm:inline">Atualizar</span>
        </Button>
      </div>
    </div>
  )
}

export default CashierFilters
