import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

// Baseado em: public.commissions
interface Commission {
  id: string
  user_id: string
  sale_id: number | null
  amount: number
  percentage: number
  period: string
  status: 'pending' | 'paid' | 'cancelled'
  paid_at: string | null
  paid_by: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

// Baseado em: public.profiles (campos relevantes)
interface Profile {
  id: string
  full_name: string | null
  [key: string]: unknown
}

interface TopEarner {
  amount: number
  name?: string
}

interface CommissionSummary {
  totalPending: number
  pendingCount: number
  totalPaid: number
  topEarner: TopEarner | null
  isGlobal: boolean
  userId?: string
}

type UserRole = 'admin' | 'gerente' | 'operador' | string

export const useCommissionSummary = (userId: string | null, userRole: UserRole) => {
  return useQuery<CommissionSummary>({
    queryKey: ['commission-summary', userId, userRole],
    queryFn: async (): Promise<CommissionSummary> => {
      if (userRole === 'admin' || userRole === 'gerente') {
        const { data: commissions, error } = await supabase
          .from('commissions')
          .select('*')
          .eq('status', 'pending')
        
        if (error) throw error
        
        const totalPending = (commissions as Commission[])?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
        const pendingCount = (commissions as Commission[])?.length || 0
        
        let topEarner: TopEarner | null = null
        if (commissions && commissions.length > 0) {
          const sorted = [...(commissions as Commission[])].sort((a, b) => b.amount - a.amount)
          const highest = sorted[0]
          
          if (highest) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', highest.user_id)
              .single()
            
            topEarner = {
              amount: highest.amount,
              name: (profile as Profile)?.full_name || 'Vendedor'
            }
          }
        }
        
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data: paidCommissions } = await supabase
          .from('commissions')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', thirtyDaysAgo.toISOString())
        
        const totalPaid = (paidCommissions as Commission[])?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
        
        return {
          totalPending,
          pendingCount,
          totalPaid,
          topEarner,
          isGlobal: true
        }
      }
      
      const { data: myCommissions, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
      
      if (error) throw error
      
      const totalPending = (myCommissions as Commission[])?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
      const pendingCount = (myCommissions as Commission[])?.length || 0
      
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: myPaidCommissions } = await supabase
        .from('commissions')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'paid')
        .gte('paid_at', thirtyDaysAgo.toISOString())
      
      const totalPaid = (myPaidCommissions as Commission[])?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
      
      const highest = myCommissions && myCommissions.length > 0 
        ? [...(myCommissions as Commission[])].sort((a, b) => b.amount - a.amount)[0]
        : null
      
      return {
        totalPending,
        pendingCount,
        totalPaid,
        topEarner: highest ? { amount: highest.amount } : null,
        isGlobal: false,
        userId: userId || undefined
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000
  })
}