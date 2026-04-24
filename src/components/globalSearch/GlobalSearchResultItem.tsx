// src/components/GlobalSearch/GlobalSearchResultItem.tsx
import React from 'react'
import { SearchResult } from '@/types/search'
import { ArrowRight } from '@lib/icons'

interface GlobalSearchResultItemProps {
  result: SearchResult
  isSelected: boolean
  onClick: () => void
}

export const GlobalSearchResultItem: React.FC<GlobalSearchResultItemProps> = ({
  result,
  isSelected,
  onClick
}) => {
  const Icon = result.icon

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
      }`}
    >
      <div className={`p-2 rounded-lg ${
        isSelected
          ? 'bg-blue-100 dark:bg-blue-800/50'
          : 'bg-gray-100 dark:bg-gray-700'
      }`}>
        <Icon size={16} className={
          isSelected
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-500 dark:text-gray-400'
        } />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${
          isSelected
            ? 'text-blue-700 dark:text-blue-300'
            : 'text-gray-900 dark:text-white'
        }`}>
          {result.title}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {result.subtitle}
        </p>
      </div>

      <ArrowRight size={16} className={`flex-shrink-0 ${
        isSelected
          ? 'text-blue-500'
          : 'text-gray-300 dark:text-gray-600'
      }`} />
    </button>
  )
}