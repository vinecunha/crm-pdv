import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const fetchDashboardData = async () => {
  const [
    customersResult,
    salesResult,
    productsResult,
    saleItemsResult
  ] = await Promise.allSettled([
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('sales').select('*').order('created_at', { ascending: false }),
    supabase.from('products').select('*').eq('is_active', true),
    supabase.from('sale_items').select(`
      quantity,
      product_id,
      product:products(name),
      created_at
    `).order('created_at', { ascending: false }).limit(500)
  ])

  return {
    customersCount: customersResult.status === 'fulfilled' && !customersResult.value.error
      ? customersResult.value.count || 0
      : 0,
    sales: salesResult.status === 'fulfilled' && !salesResult.value.error
      ? salesResult.value.data || []
      : [],
    products: productsResult.status === 'fulfilled' && !productsResult.value.error
      ? productsResult.value.data || []
      : [],
    saleItems: saleItemsResult.status === 'fulfilled' && !saleItemsResult.value.error
      ? saleItemsResult.value.data || []
      : []
  }
}

export const useDashboardData = () => {
  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
    staleTime: 2 * 60 * 1000, // 2 minutos
    refetchOnWindowFocus: true,
    retry: 2
  })
}