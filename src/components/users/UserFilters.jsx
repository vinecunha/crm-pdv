import React, { useState } from 'react'
import { Search, Filter, X } from '../../lib/icons'
import Button from '../ui/Button'

const UserFilters = ({ searchTerm, setSearchTerm, filters, setFilters }) => {
  const [showFilters, setShowFilters] = useState(false)
  const hasActiveFilters = filters.role

  const clearFilters = () => {
    setFilters({ role: '' })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[250px] relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuários por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} icon={Filter}>
          Filtros {hasActiveFilters && '•'}
        </Button>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1">
            <X size={14} /> Limpar
          </button>
        )}
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <select
            value={filters.role || ''}
            onChange={(e) => setFilters({ role: e.target.value })}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos os papéis</option>
            <option value="admin">Administrador</option>
            <option value="gerente">Gerente</option>
            <option value="operador">Operador</option>
          </select>
        </div>
      )}
    </div>
  )
}

export default UserFilters