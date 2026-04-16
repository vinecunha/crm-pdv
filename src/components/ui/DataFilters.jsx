import React, { useState, useEffect } from 'react'
import { Search, Filter, X } from '../../lib/icons'
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
  const [isFiltersVisible, setIsFiltersVisible] = React.useState(false)
  const [localFilters, setLocalFilters] = React.useState({})
  
  const [localSearch, setLocalSearch] = React.useState(searchValue)
  const debouncedSearch = useDebounce(localSearch, searchDebounceDelay)

  React.useEffect(() => {
    onSearchChange(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
          />
          {localSearch !== debouncedSearch && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin dark:border-blue-400" />
            </div>
          )}
        </div>
        
        {showFilters && filters.length > 0 && (
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 transition-colors
              ${isFiltersVisible || hasActiveFilters 
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300' 
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <Filter size={18} />
            Filtros
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full dark:bg-blue-700">
                {Object.values(localFilters).filter(v => v !== '').length}
              </span>
            )}
          </button>
        )}
      </div>

      {showFilters && isFiltersVisible && filters.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">Filtros Avançados</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1"
              >
                <X size={14} />
                Limpar filtros
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {filter.label}
                </label>
                {filter.type === 'select' ? (
                  <select
                    value={localFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
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
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={filter.placeholder}
                    value={localFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
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