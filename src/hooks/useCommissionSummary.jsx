import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export const useCommissionSummary = (userId, userRole) => {
  return useQuery({
    queryKey: ['commission-summary', userId, userRole],
    queryFn: async () => {
      // Se for admin/gerente, busca resumo de TODOS
      if (userRole === 'admin' || userRole === 'gerente') {
        const { data: commissions, error } = await supabase
          .from('commissions')
          .select('*')
          .eq('status', 'pending')
        
        if (error) throw error
        
        const totalPending = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0
        const pendingCount = commissions?.length || 0
        
        // Buscar top earner (maior comissão pendente)
        const { data: topEarner } = await supabase
          .from('commissions')
          .select(`
            amount,
            user:profiles!commissions_user_id_fkey(full_name)
          `)
          .eq('status', 'pending')
          .order('amount', { ascending: false })
          .limit(1)
          .single()
        
        // Total pago (últimos 30 dias)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data: paidCommissions } = await supabase
          .from('commissions')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', thirtyDaysAgo.toISOString())
        
        const totalPaid = paidCommissions?.reduce((sum, c) => sum + c.amount, 0) || 0
        
        return {
          totalPending,
          pendingCount,
          totalPaid,
          topEarner: topEarner ? {
            name: topEarner.user?.full_name || 'Vendedor',
            amount: topEarner.amount
          } : null,
          isGlobal: true
        }
      }
      
      // ✅ OPERADOR: Vê apenas suas próprias comissões
      const { data: myCommissions, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'pending')
      
      if (error) throw error
      
      const totalPending = myCommissions?.reduce((sum, c) => sum + c.amount, 0) || 0
      const pendingCount = myCommissions?.length || 0
      
      // Total pago (últimos 30 dias)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data: myPaidCommissions } = await supabase
        .from('commissions')
        .select('amount')
        .eq('user_id', userId)
        .eq('status', 'paid')
        .gte('paid_at', thirtyDaysAgo.toISOString())
      
      const totalPaid = myPaidCommissions?.reduce((sum, c) => sum + c.amount, 0) || 0
      
      // Maior comissão pendente do operador
      const topEarner = myCommissions?.length > 0 
        ? { amount: Math.max(...myCommissions.map(c => c.amount)) }
        : null
      
      return {
        totalPending,
        pendingCount,
        totalPaid,
        topEarner,
        isGlobal: false
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000 // 2 minutos
  })
}