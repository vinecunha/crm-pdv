import React, { useState } from 'react'
import { Search, Filter, X } from '@lib/icons'
import Button from '../ui/Button'

const CouponFilters = ({ searchTerm, setSearchTerm, filters, setFilters }) => {
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = Object.values(filters).some(v => v && v !== 'all')

  const clearFilters = () => {
    setFilters({ status: 'all', discount_type: 'all', is_global: 'all' })
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[250px] relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por código ou nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
          icon={Filter}
        >
          Filtros {hasActiveFilters && '•'}
        </Button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
          >
            <X size={14} />
            Limpar
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <select
            value={filters.status || 'all'}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm"
          >
            <option value="all">Todos os status</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>

          <select
            value={filters.discount_type || 'all'}
            onChange={(e) => setFilters({ ...filters, discount_type: e.target.value })}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm"
          >
            <option value="all">Todos os tipos</option>
            <option value="percent">Percentual</option>
            <option value="fixed">Valor Fixo</option>
          </select>

          <select
            value={filters.is_global || 'all'}
            onChange={(e) => setFilters({ ...filters, is_global: e.target.value })}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg text-sm"
          >
            <option value="all">Todas abrangências</option>
            <option value="global">Global</option>
            <option value="restricted">Restrito</option>
          </select>
        </div>
      )}
    </div>
  )
}

export default CouponFilters