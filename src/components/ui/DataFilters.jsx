import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Search, Filter, X, ChevronDown } from '../../lib/icons'
import useDebounce from '../../hooks/useDebounce'

const DataFilters = ({
  searchPlaceholder = "Buscar...",
  searchValue = "",
  onSearchChange,
  filters = [],
  onFilterChange,
  showFilters = true,
  className = "",
  searchDebounceDelay = 300,
  variant = 'default', // 'default', 'minimal', 'floating'
  size = 'md', // 'sm', 'md', 'lg'
}) => {
  const [isFiltersVisible, setIsFiltersVisible] = useState(false)
  const [localFilters, setLocalFilters] = useState({})
  const [localSearch, setLocalSearch] = useState(searchValue)
  const debouncedSearch = useDebounce(localSearch, searchDebounceDelay)
  
  // Memoize active filters count
  const activeFiltersCount = useMemo(() => 
    Object.values(localFilters).filter(v => v && v !== '').length
  , [localFilters])
  
  const hasActiveFilters = activeFiltersCount > 0

  // Initialize filters from props
  useEffect(() => {
    if (filters.length > 0) {
      const initialFilters = {}
      filters.forEach(filter => {
        initialFilters[filter.key] = filter.defaultValue || ''
      })
      setLocalFilters(initialFilters)
    }
  }, [filters])

  // Sync with external search value
  useEffect(() => {
    setLocalSearch(searchValue)
  }, [searchValue])

  // Handle debounced search
  useEffect(() => {
    onSearchChange?.(debouncedSearch)
  }, [debouncedSearch, onSearchChange])

  const handleFilterChange = useCallback((key, value) => {
    setLocalFilters(prev => {
      const newFilters = { ...prev, [key]: value }
      onFilterChange?.(newFilters)
      return newFilters
    })
  }, [onFilterChange])

  const clearFilters = useCallback(() => {
    const clearedFilters = {}
    filters.forEach(filter => {
      clearedFilters[filter.key] = ''
    })
    setLocalFilters(clearedFilters)
    onFilterChange?.(clearedFilters)
  }, [filters, onFilterChange])

  const clearSearch = useCallback(() => {
    setLocalSearch('')
  }, [])

  const toggleFilters = useCallback(() => {
    setIsFiltersVisible(prev => !prev)
  }, [])

  // Size variants
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-2',
    md: 'text-sm py-2 px-3',
    lg: 'text-base py-2.5 px-4'
  }

  const iconSizes = {
    sm: 14,
    md: 16,
    lg: 18
  }

  const inputSizeClass = sizeClasses[size]
  const iconSize = iconSizes[size]

  // Variant classes
  const containerClasses = {
    default: 'space-y-3',
    minimal: 'space-y-2',
    floating: 'relative'
  }

  const filterButtonClasses = `
    flex-shrink-0 ${inputSizeClass} border rounded-lg flex items-center gap-1.5 transition-all duration-200
    ${isFiltersVisible || hasActiveFilters 
      ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 shadow-sm' 
      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
    }
  `

  const renderFilterInput = (filter) => {
    const commonProps = {
      value: localFilters[filter.key] || '',
      onChange: (e) => handleFilterChange(filter.key, e.target.value),
      className: `w-full ${inputSizeClass} bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200`
    }

    switch (filter.type) {
      case 'select':
        return (
          <div className="relative">
            <select {...commonProps}>
              <option value="">Todos</option>
              {filter.options?.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={iconSize} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" 
            />
          </div>
        )
      
      case 'date':
        return <input type="date" {...commonProps} />
      
      case 'number':
        return <input type="number" {...commonProps} placeholder={filter.placeholder} />
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localFilters[filter.key] || false}
              onChange={(e) => handleFilterChange(filter.key, e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">{filter.label}</span>
          </label>
        )
      
      default:
        return <input type="text" {...commonProps} placeholder={filter.placeholder} />
    }
  }

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {/* Search Bar */}
      <div className="flex items-stretch gap-2">
        <div className="flex-1 relative min-w-0">
          <Search 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-colors" 
            size={iconSize} 
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className={`
              w-full pl-9 pr-8 ${inputSizeClass} 
              bg-white dark:bg-gray-800 
              border border-gray-300 dark:border-gray-600 
              text-gray-900 dark:text-white 
              rounded-lg 
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent 
              placeholder-gray-400 dark:placeholder-gray-500
              transition-all duration-200
            `}
          />
          {localSearch && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Limpar busca"
            >
              <X size={iconSize - 2} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
            </button>
          )}
          {localSearch !== debouncedSearch && !localSearch && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        
        {showFilters && filters.length > 0 && (
          <button
            onClick={toggleFilters}
            className={filterButtonClasses}
            aria-expanded={isFiltersVisible}
            aria-label="Toggle filters"
          >
            <Filter size={iconSize} />
            <span className="hidden xs:inline font-medium">Filtros</span>
            {hasActiveFilters && (
              <span className="ml-0.5 px-1.5 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full dark:bg-blue-700">
                {activeFiltersCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && isFiltersVisible && filters.length > 0 && (
        <div className={`
          bg-gray-50 dark:bg-gray-900 
          border border-gray-200 dark:border-gray-700 
          rounded-lg p-3 sm:p-4
          ${variant === 'floating' ? 'absolute z-10 mt-2 w-full shadow-lg' : ''}
          animate-in slide-in-from-top-2 duration-200
        `}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Filtros Avançados
            </h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <X size={14} />
                <span className="hidden xs:inline">Limpar todos</span>
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-1">
                {filter.type !== 'checkbox' && (
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    {filter.label}
                  </label>
                )}
                {renderFilterInput(filter)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DataFilters