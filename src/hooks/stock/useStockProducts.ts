import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) throw error
  return data || []
}

const fetchSessionItems = async (sessionId) => {
  if (!sessionId) return []
  
  const { data, error } = await supabase
    .from('stock_count_items')
    .select(`*, product:products(*)`)
    .eq('count_session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export const useStockProducts = () => {
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 60000
  })

  return {
    products: productsQuery.data || [],
    isLoadingProducts: productsQuery.isLoading,
    errorProducts: productsQuery.error
  }
}

export const useSessionItems = (sessionId) => {
  const itemsQuery = useQuery({
    queryKey: ['stockSessionItems', sessionId],
    queryFn: () => fetchSessionItems(sessionId),
    enabled: !!sessionId,
    staleTime: 10000
  })

  return {
    items: itemsQuery.data || [],
    isLoading: itemsQuery.isLoading,
    error: itemsQuery.error
  }
}