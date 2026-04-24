// src/hooks/useGlobalSearch/useKeyboardNavigation.ts
import { useState, useCallback } from 'react'
import { SearchResult } from '@/types/search'

interface UseKeyboardNavigationOptions {
  results: SearchResult[]
  onSelect: (result: SearchResult) => void
  onClose: () => void
}

export function useKeyboardNavigation({ results, onSelect, onClose }: UseKeyboardNavigationOptions) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const resetSelection = useCallback(() => {
    setSelectedIndex(0)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          onSelect(results[selectedIndex])
        }
        break
      
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      
      case 'Tab':
        // Permitir Tab normal
        break
      
      default:
        // Resetar seleção quando digitar
        break
    }
  }, [results, selectedIndex, onSelect, onClose])

  return {
    selectedIndex,
    resetSelection,
    handleKeyDown
  }
}