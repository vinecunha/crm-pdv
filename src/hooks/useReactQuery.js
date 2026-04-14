import { useQueryClient } from '@tanstack/react-query'
import { clearPersistedCache } from '../lib/react-query'

export const useReactQuery = () => {
  const queryClient = useQueryClient()

  const invalidateAll = () => {
    return queryClient.invalidateQueries()
  }

  const invalidateQueries = (queryKey) => {
    return queryClient.invalidateQueries({ queryKey })
  }

  const refetchQueries = (queryKey) => {
    return queryClient.refetchQueries({ queryKey })
  }

  const clearCache = () => {
    // Limpar tanto o cache em memória quanto o persistido
    clearPersistedCache()
    return queryClient.clear()
  }

  const clearPersistedOnly = () => {
    return clearPersistedCache()
  }

  const getQueryData = (queryKey) => {
    return queryClient.getQueryData(queryKey)
  }

  const setQueryData = (queryKey, updater) => {
    return queryClient.setQueryData(queryKey, updater)
  }

  const removeQueries = (queryKey) => {
    return queryClient.removeQueries({ queryKey })
  }

  const resetQueries = (queryKey) => {
    return queryClient.resetQueries({ queryKey })
  }

  const cancelQueries = (queryKey) => {
    return queryClient.cancelQueries({ queryKey })
  }

  const getQueryState = (queryKey) => {
    return queryClient.getQueryState(queryKey)
  }

  const isFetching = (queryKey) => {
    return queryClient.isFetching({ queryKey })
  }

  const getCacheSize = () => {
    const queries = queryClient.getQueryCache().getAll()
    return queries.length
  }

  return {
    queryClient,
    invalidateAll,
    invalidateQueries,
    refetchQueries,
    clearCache,
    clearPersistedOnly,
    getQueryData,
    setQueryData,
    removeQueries,
    resetQueries,
    cancelQueries,
    getQueryState,
    isFetching,
    getCacheSize,
  }
}