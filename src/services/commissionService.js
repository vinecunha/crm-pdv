// src/services/commissionService.js
import { supabase } from '../lib/supabase'

export const fetchSellerCommissions = async (userId, period = null) => {
  const { data, error } = await supabase.rpc('fetch_seller_commissions', {
    p_user_id: userId,
    p_period: period
  })
  
  if (error) throw error
  return data
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