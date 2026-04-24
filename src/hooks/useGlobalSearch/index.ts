// src/hooks/useGlobalSearch/index.ts
import { useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchResult, SearchGroup } from '@/types/search'
import { useSearchQuery } from './useSearchQuery'
import { useKeyboardNavigation } from './useKeyboardNavigation'
import { useClickOutside } from './useClickOutside'

interface UseGlobalSearchOptions {
  isOpen: boolean
  onClose: () => void
}

export function useGlobalSearch({ isOpen, onClose }: UseGlobalSearchOptions) {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Query de busca
  const {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearQuery,
    hasQuery,
    isEmpty
  } = useSearchQuery({ debounceMs: 300, minQueryLength: 2 })

  // Selecionar resultado
  const handleSelect = useCallback((result: SearchResult) => {
    navigate(result.path)
    onClose()
    clearQuery()
  }, [navigate, onClose, clearQuery])

  // Navegação por teclado
  const {
    selectedIndex,
    resetSelection,
    handleKeyDown
  } = useKeyboardNavigation({
    results,
    onSelect: handleSelect,
    onClose
  })

  // Clique fora
  useClickOutside(containerRef, onClose, isOpen)

  // Agrupar resultados por categoria
  const groupedResults = results.reduce<SearchGroup[]>((acc, result) => {
    const existingGroup = acc.find(g => g.category === result.category)
    if (existingGroup) {
      existingGroup.items.push(result)
    } else {
      acc.push({ category: result.category, items: [result] })
    }
    return acc
  }, [])

  return {
    // Refs
    containerRef,
    inputRef,
    
    // Estado
    query,
    results,
    groupedResults,
    isLoading,
    error,
    hasQuery,
    isEmpty,
    selectedIndex,
    
    // Handlers
    setQuery,
    handleSelect,
    handleKeyDown,
    clearQuery,
    resetSelection,
    
    // Controles
    isOpen
  }
}