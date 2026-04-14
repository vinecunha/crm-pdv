import React, { useState, useEffect } from 'react'
import { Search, Filter, X } from 'lucide-react'
import useDebounce from '../../hooks/useDebounce'

const DataFilters = ({
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
  filters = [],
  onFilterChange,
  showFilters = true,
  className = "",
  searchDebounceDelay = 300
}) => {
  // ✅ Agora useState vai funcionar
  const [isFiltersVisible, setIsFiltersVisible] = React.useState(false)
  const [localFilters, setLocalFilters] = React.useState({})
  
  // Estado local para busca com debounce
  const [localSearch, setLocalSearch] = React.useState(searchValue)
  const debouncedSearch = useDebounce(localSearch, searchDebounceDelay)

  // Sincronizar busca debounced com o pai
  React.useEffect(() => {
    onSearchChange(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

  // Sincronizar quando searchValue externo mudar
  React.useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  React.useEffect(() => {
    if (filters.length > 0) {
      const initialFilters = {}
      filters.forEach(filter => {
        initialFilters[filter.key] = filter.defaultValue || ''
      })
      setLocalFilters(initialFilters)
    }
  }, [filters])

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters = {}
    filters.forEach(filter => {
      clearedFilters[filter.key] = ''
    })
    setLocalFilters(clearedFilters)
    onFilterChange?.(clearedFilters)
  }

  const hasActiveFilters = Object.values(localFilters).some(v => v !== '')

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {/* Indicador de busca em andamento */}
          {localSearch !== debouncedSearch && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {showFilters && filters.length > 0 && (
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors
              ${isFiltersVisible || hasActiveFilters 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <Filter size={18} />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {Object.values(localFilters).filter(v => v !== '').length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && isFiltersVisible && filters.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700">Filtros Avançados</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <X size={14} />
                Limpar filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-1">
                <label className="text-xs font-medium text-gray-600">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <select
                    value={localFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos</option>
                    {filter.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : filter.type === 'date' ? (
                  <input
                    type="date"
                    value={localFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={filter.placeholder}
                    value={localFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DataFilters