import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export const useCoupons = (searchTerm = '', filters = {}) => {
  return useQuery({
    queryKey: ['coupons', { searchTerm, filters }],
    queryFn: async () => {
      let query = supabase.from('coupons').select('*').order('created_at', { ascending: false })
      
      if (searchTerm?.trim()) {
        query = query.or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('is_active', filters.status === 'active')
      }
      if (filters?.discount_type && filters.discount_type !== 'all') {
        query = query.eq('discount_type', filters.discount_type)
      }
      
      const { data, error } = await query
      if (error) throw error
      return data || []
    },
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateCoupon = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (couponData) => {
      const { data, error } = await supabase.from('coupons').insert([couponData]).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
    },
  })
}
