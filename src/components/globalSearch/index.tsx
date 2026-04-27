// src/components/GlobalSearch/index.tsx
import React, { useEffect } from 'react'
import { useGlobalSearch } from '@hooks/useGlobalSearch'
import { GlobalSearchInput } from '@components/globalSearch/GlobalSearchInput'
import { GlobalSearchResults } from '@components/globalSearch/GlobalSearchResults'
import { GlobalSearchEmpty } from '@components/globalSearch/GlobalSearchEmpty'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const {
    containerRef,
    inputRef,
    query,
    results,
    groupedResults,
    isLoading,
    hasQuery,
    isEmpty,
    selectedIndex,
    setQuery,
    handleSelect,
    handleKeyDown,
    clearQuery,
    resetSelection
  } = useGlobalSearch({ isOpen, onClose })

  // Focar input quando abrir
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, inputRef])

  // Resetar quando fechar
  useEffect(() => {
    if (!isOpen) {
      clearQuery()
      resetSelection()
    }
  }, [isOpen, clearQuery, resetSelection])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
        onClick={onClose} 
      />

      {/* Search Panel */}
      <div 
        ref={containerRef}
        className="fixed inset-x-0 top-0 z-50 mx-auto max-w-2xl mt-20 px-4"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl 
          border border-gray-200 dark:border-gray-700 overflow-hidden">
          
          {/* Input de busca */}
          <GlobalSearchInput
            value={query}
            onChange={setQuery}
            onClear={clearQuery}
            onClose={onClose}
            onKeyDown={handleKeyDown}
            isLoading={isLoading}
            inputRef={inputRef}
          />

          {/* Resultados ou estado vazio */}
          {results.length > 0 ? (
            <GlobalSearchResults
              groupedResults={groupedResults}
              results={results}
              selectedIndex={selectedIndex}
              onSelect={handleSelect}
            />
          ) : (
            <GlobalSearchEmpty
              isLoading={isLoading}
              hasQuery={hasQuery}
              isEmpty={isEmpty}
            />
          )}

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 
            flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-4">
              <span>↑↓ Navegar</span>
              <span>↵ Abrir</span>
              <span>ESC Fechar</span>
            </div>
            <span>
              {results.length} resultado{results.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default GlobalSearch