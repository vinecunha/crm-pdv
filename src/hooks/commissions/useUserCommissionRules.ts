import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

// Baseado em: public.commission_rules
interface CommissionRule {
  id: string
  name: string
  percentage: number
  min_sales: number | null
  max_sales: number | null
  applies_to: string[] | null
  is_active: boolean | null
  priority: number | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  description: string | null
  rule_type: 'percentage' | 'fixed' | null
}

interface UserCommissionRule {
  id: string
  user_id: string
  rule_id: string
  is_active: boolean
  created_at: string | null
  rule: CommissionRule
  [key: string]: unknown
}

export const useUserCommissionRules = (userId: string | null) => {
  return useQuery<UserCommissionRule[]>({
    queryKey: ['user-commission-rules', userId],
    queryFn: async (): Promise<UserCommissionRule[]> => {
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
      return (data as UserCommissionRule[]) || []
    },
    enabled: !!userId
  })
}