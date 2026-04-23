// src/hooks/useCommissionSummary.js
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export const useCommissionSummary = (userId, userRole) => {
  return useQuery({
    queryKey: ['commission-summary', userId, userRole],
    queryFn: async () => {
      // Se for admin/gerente, busca resumo de TODOS
      if (userRole === 'admin' || userRole === 'gerente') {
        // ✅ CORRIGIDO: Buscar comissões primeiro, depois os perfis separadamente
        const { data: commissions, error } = await supabase
          .from('commissions')
          .select('*')
          .eq('status', 'pending')
        
        if (error) throw error
        
        const totalPending = commissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
        const pendingCount = commissions?.length || 0
        
        // ✅ Buscar top earner separadamente (evitar erro de FK)
        let topEarner = null
        if (commissions && commissions.length > 0) {
          // Ordenar localmente em vez de no banco
          const sorted = [...commissions].sort((a, b) => b.amount - a.amount)
          const highest = sorted[0]
          
          if (highest) {
            // Buscar perfil do usuário separadamente
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', highest.user_id)
              .single()
            
            topEarner = {
              amount: highest.amount,
              name: profile?.full_name || 'Vendedor'
            }
          }
        }
        
        // Total pago (últimos 30 dias)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const { data: paidCommissions } = await supabase
          .from('commissions')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', thirtyDaysAgo.toISOString())
        
        const totalPaid = paidCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
        
        return {
          totalPending,
          pendingCount,
          totalPaid,
          topEarner,
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
      
      const totalPending = myCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
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
      
      const totalPaid = myPaidCommissions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0
      
      // Maior comissão pendente do operador
      const highest = myCommissions?.length > 0 
        ? myCommissions.sort((a, b) => b.amount - a.amount)[0]
        : null
      
      return {
        totalPending,
        pendingCount,
        totalPaid,
        topEarner: highest ? { amount: highest.amount } : null,
        isGlobal: false,
        userId
      }
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000 // 2 minutos
  })
}
