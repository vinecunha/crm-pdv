import { useQueryClient, QueryKey, Updater } from '@tanstack/react-query'
import { clearPersistedCache } from '@lib/react-query'

interface UseReactQueryReturn {
  queryClient: ReturnType<typeof useQueryClient>
  invalidateAll: () => Promise<void>
  invalidateQueries: (queryKey: QueryKey) => Promise<void>
  refetchQueries: (queryKey: QueryKey) => Promise<void>
  clearCache: () => void
  clearPersistedOnly: () => void
  getQueryData: <T>(queryKey: QueryKey) => T | undefined
  setQueryData: <T>(queryKey: QueryKey, updater: Updater<T | undefined, T | undefined>) => T | undefined
  removeQueries: (queryKey: QueryKey) => void
  resetQueries: (queryKey: QueryKey) => Promise<void>
  cancelQueries: (queryKey: QueryKey) => Promise<void>
  getQueryState: (queryKey: QueryKey) => unknown
  isFetching: (queryKey: QueryKey) => number
  getCacheSize: () => number
}

export const useReactQuery = (): UseReactQueryReturn => {
  const queryClient = useQueryClient()

  const invalidateAll = (): Promise<void> => {
    return queryClient.invalidateQueries()
  }

  const invalidateQueries = (queryKey: QueryKey): Promise<void> => {
    return queryClient.invalidateQueries({ queryKey })
  }

  const refetchQueries = (queryKey: QueryKey): Promise<void> => {
    return queryClient.refetchQueries({ queryKey })
  }

  const clearCache = (): void => {
    clearPersistedCache()
    queryClient.clear()
  }

  const clearPersistedOnly = (): void => {
    clearPersistedCache()
  }

  const getQueryData = <T>(queryKey: QueryKey): T | undefined => {
    return queryClient.getQueryData<T>(queryKey)
  }

  const setQueryData = <T>(queryKey: QueryKey, updater: Updater<T | undefined, T | undefined>): T | undefined => {
    return queryClient.setQueryData<T>(queryKey, updater)
  }

  const removeQueries = (queryKey: QueryKey): void => {
    queryClient.removeQueries({ queryKey })
  }

  const resetQueries = (queryKey: QueryKey): Promise<void> => {
    return queryClient.resetQueries({ queryKey })
  }

  const cancelQueries = (queryKey: QueryKey): Promise<void> => {
    return queryClient.cancelQueries({ queryKey })
  }

  const getQueryState = (queryKey: QueryKey): unknown => {
    return queryClient.getQueryState(queryKey)
  }

  const isFetching = (queryKey: QueryKey): number => {
    return queryClient.isFetching({ queryKey })
  }

  const getCacheSize = (): number => {
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
    getCacheSize
  }
}