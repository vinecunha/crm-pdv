// src/services/commissionService.js
import { supabase } from '@lib/supabase'

export const fetchSellerCommissions = async (userId, period = null) => {
  try {
    console.log('📞 Chamando RPC fetch_seller_commissions:', { userId, period })
    
    const { data, error } = await supabase.rpc('fetch_seller_commissions', {
      p_user_id: userId,
      p_period: period || null
    })
    
    if (error) {
      console.error('❌ Erro na RPC:', error)
      throw error
    }
    
    console.log('✅ Resposta da RPC:', data)
    
    // A RPC retorna um objeto com a estrutura { summary, history }
    // Garantir que sempre retorne algo válido
    if (!data) {
      console.warn('⚠️ RPC retornou null/undefined, retornando estrutura vazia')
      return {
        summary: {
          total_pending: 0,
          total_paid: 0,
          total_cancelled: 0,
          total_amount: 0,
          count_pending: 0,
          count_paid: 0,
          count_total: 0
        },
        history: []
      }
    }
    
    return data
    
  } catch (error) {
    console.error('❌ Exceção em fetchSellerCommissions:', error)
    // Retornar estrutura vazia em caso de erro
    return {
      summary: {
        total_pending: 0,
        total_paid: 0,
        total_cancelled: 0,
        total_amount: 0,
        count_pending: 0,
        count_paid: 0,
        count_total: 0
      },
      history: []
    }
  }
}

export const fetchCommissionRules = async () => {
  const { data, error } = await supabase
    .from('commission_rules')
    .select('*')
    .eq('is_active', true)
    .order('priority')
  
  if (error) throw error
  return data
}

export const updateCommissionStatus = async (commissionId, status, paidBy) => {
  const { data, error } = await supabase
    .from('commissions')
    .update({ 
      status, 
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      paid_by: status === 'paid' ? paidBy : null
    })
    .eq('id', commissionId)
    .select()
    .single()
  
  if (error) throw error
  return data
}