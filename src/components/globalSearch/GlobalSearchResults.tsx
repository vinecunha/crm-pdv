// src/components/GlobalSearch/GlobalSearchResults.tsx
import React from 'react'
import { SearchGroup, SearchResult, SearchHandler } from '@/types/search'
import { GlobalSearchResultItem } from './GlobalSearchResultItem'

interface GlobalSearchResultsProps {
  groupedResults: SearchGroup[]
  results: SearchResult[]
  selectedIndex: number
  onSelect: SearchHandler
}

export const GlobalSearchResults: React.FC<GlobalSearchResultsProps> = ({
  groupedResults,
  results,
  selectedIndex,
  onSelect
}) => {
  return (
    <div className="max-h-96 overflow-y-auto py-2">
      {groupedResults.map((group) => (
        <div key={group.category} className="mb-2">
          <p className="px-4 py-1 text-[10px] font-semibold text-gray-400 
            dark:text-gray-500 uppercase tracking-wider">
            {group.category}
          </p>
          {group.items.map((result) => {
            const globalIndex = results.indexOf(result)
            
            return (
              <GlobalSearchResultItem
                key={`${result.type}-${result.id}`}
                result={result}
                isSelected={selectedIndex === globalIndex}
                onClick={() => onSelect(result)}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}