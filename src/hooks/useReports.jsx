import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export const useSalesReport = (filters) => {
  return useQuery({
    queryKey: ['report', 'sales', filters],
    queryFn: async () => {
      let query = supabase.from('sales').select('*')
      
      // Aplicar filtros
      if (filters.dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0]
        query = query.gte('created_at', today)
      } else if (filters.dateRange === 'custom' && filters.customDateRange) {
        query = query
          .gte('created_at', filters.customDateRange.start)
          .lte('created_at', filters.customDateRange.end + 'T23:59:59')
      }
      
      if (filters.paymentMethodFilter) {
        query = query.eq('payment_method', filters.paymentMethodFilter)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!filters,
  })
}

export const useOperatorReport = (filters) => {
  return useQuery({
    queryKey: ['report', 'operators', filters],
    queryFn: async () => {
      // Implementar lógica específica para operadores
      const { data, error } = await supabase.rpc('get_operator_performance', {
        p_start_date: filters.customDateRange?.start,
        p_end_date: filters.customDateRange?.end,
      })
      
      if (error) throw error
      return data || []
    },
    staleTime: 5 * 60 * 1000,
  })
}

export const useProductsReport = (filters) => {
  return useQuery({
    queryKey: ['report', 'products', filters],
    queryFn: async () => {
      // Implementar lógica para produtos
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          product:products(name, price)
        `)
      
      if (error) throw error
      
      // Processar dados
      return data || []
    },
    staleTime: 10 * 60 * 1000, // 10 minutos
  })
}