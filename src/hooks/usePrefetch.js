import { useQueryClient } from '@tanstack/react-query'

const prefetchMap = {
  products: async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('products').select('*').eq('is_active', true)
  },
  customers: async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('customers').select('*')
  },
  sales: async () => {
    const { supabase } = await import('../lib/supabase')
    return supabase.from('sales').select('*').order('created_at', { ascending: false }).limit(50)
  },
}

export const usePrefetch = () => {
  const queryClient = useQueryClient()

  const prefetch = async (queryKey) => {
    const existingData = queryClient.getQueryData([queryKey])
    if (existingData) return

    const prefetchFn = prefetchMap[queryKey]
    if (!prefetchFn) return

    return queryClient.prefetchQuery({
      queryKey: [queryKey],
      queryFn: prefetchFn,
      staleTime: 5 * 60 * 1000,
    })
  }

  const prefetchMany = async (queryKeys) => {
    return Promise.all(queryKeys.map(key => prefetch(key)))
  }

  return { prefetch, prefetchMany }
}