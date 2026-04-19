import React from 'react'
import { Search } from '../../../lib/icons'

const SearchInput = ({ 
  value, 
  onChange, 
  placeholder = "Buscar...",
  className = "",
  autoFocus = false
}) => {
  return (
    <div className={`flex-1 relative ${className}`}>
      <Search 
        size={18} 
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" 
      />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder-gray-400 dark:placeholder-gray-500"
        autoFocus={autoFocus}
      />
    </div>
  )
}

export default SearchInput