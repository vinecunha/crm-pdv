import { QueryClient } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { get, set, del } from 'idb-keyval'
import { logger } from '@utils/logger'

// Lista de queries que NÃO devem ser persistidas (dados sensíveis)
const SENSITIVE_QUERY_KEYS = [
  'auth',
  'session',
  'permissions',
  'user-profile',
  'profile',
  'blocked-users',
  'system_logs',
  'logs',
  'user',
  'current-user',
]

// Lista de queries que DEVEM ser persistidas (apenas dados estáticos)
const PERSISTABLE_QUERY_KEYS = [
  'company-settings',
  'categories',
]

// Configuração otimizada para PDV
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
      onError: (error) => {
        logger.error('[React Query] Mutation error:', error)
      },
    },
  },
})

// Função para verificar se uma query deve ser persistida
const shouldPersistQuery = (queryKey) => {
  if (!queryKey || queryKey.length === 0) return false

  const key = queryKey[0]

  if (SENSITIVE_QUERY_KEYS.includes(key)) {
    return false
  }

  return PERSISTABLE_QUERY_KEYS.includes(key)
}

// IndexedDB storage adapter using idb-keyval
const indexedDBStorage = {
  getItem: async (key: string) => {
    try {
      return await get(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await set(key, value)
    } catch (error) {
      logger.warn('[React Query] Erro ao salvar no IndexedDB:', error)
    }
  },
  removeItem: async (key: string) => {
    try {
      await del(key)
    } catch (error) {
      logger.warn('[React Query] Erro ao remover do IndexedDB:', error)
    }
  },
}

// Persistir cache no IndexedDB (assíncrono)
if (typeof window !== 'undefined') {
  try {
    // Use localStorage as fallback for sync persister with limited scope
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: 'REACT_QUERY_CACHE_V3',
      throttleTime: 5000, // Increased throttle to reduce writes
    })

    persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000,
      buster: import.meta.env.npm_package_version || '1.0.0',
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          if (query.state.status !== 'success') return false
          return shouldPersistQuery(query.queryKey)
        },
      },
    })

    logger.log('✅ [React Query] Persist client inicializado (apenas dados estáticos)')
  } catch (error) {
    logger.warn('⚠️ [React Query] Erro ao inicializar persist client:', error)
  }
}

// Funções helper
export const clearPersistedCache = () => {
  try {
    localStorage.removeItem('REACT_QUERY_CACHE_V3')
    logger.log('✅ [React Query] Cache persistido limpo')
    return true
  } catch (error) {
    logger.warn('[React Query] Erro ao limpar cache:', error)
    return false
  }
}

export const getCacheStats = () => {
  try {
    const cache = localStorage.getItem('REACT_QUERY_CACHE_V3')
    if (!cache) return { size: 0, entries: 0 }

    const size = new Blob([cache]).size
    const data = JSON.parse(cache)
    const entries = Object.keys(data?.clientState?.queries || {}).length

    return { size, entries }
  } catch (error) {
    return { size: 0, entries: 0 }
  }
}

export const invalidateQueries = (queryClient, queryKey) => {
  return queryClient.invalidateQueries({ queryKey })
}

export const clearAllCache = (queryClient) => {
  try {
    localStorage.removeItem('REACT_QUERY_CACHE_V3')
  } catch (error) {
    logger.warn('[React Query] Erro ao limpar localStorage:', error)
  }
  return queryClient.clear()
}

export const prefetchQuery = async (queryClient, queryKey, queryFn) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: 5 * 60 * 1000,
  })
}
