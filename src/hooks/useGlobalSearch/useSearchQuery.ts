// src/hooks/useGlobalSearch/useSearchQuery.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { SearchResult, SearchFilters } from '@/types/search'
import { performGlobalSearch } from '@services/search'
import { useAuth } from '@contexts/AuthContext'

interface UseSearchQueryOptions {
  debounceMs?: number
  minQueryLength?: number
}

export function useSearchQuery(options: UseSearchQueryOptions = {}) {
  const { debounceMs = 300, minQueryLength = 2 } = options
  const { profile } = useAuth()
  
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  const search = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minQueryLength) {
      setResults([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const filters: SearchFilters = {
        query: searchQuery,
        role: profile?.role
      }

      const searchResults = await performGlobalSearch(filters)
      setResults(searchResults)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro na busca'))
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [minQueryLength, profile?.role])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      search(query)
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, search, debounceMs])

  const clearQuery = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearQuery,
    hasQuery: query.length >= minQueryLength,
    isEmpty: query.length >= minQueryLength && !isLoading && results.length === 0
  }
}