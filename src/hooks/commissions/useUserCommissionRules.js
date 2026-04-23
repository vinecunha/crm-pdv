import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export const useUserCommissionRules = (userId) => {
  return useQuery({
    queryKey: ['user-commission-rules', userId],
    queryFn: async () => {
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('user_commission_rules')
        .select(`
          *,
          rule:rule_id(*)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!userId
  })
}
