import { supabase } from '@lib/supabase'

/**
 * Buscar todas as vendas com filtros e informações dos usuários
 */
export const fetchSales = async (searchTerm = '', filters = {}) => {
  // Buscar vendas primeiro
  let query = supabase
    .from('sales')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (searchTerm?.trim()) {
    query = query.or(`sale_number.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  if (filters?.start_date) {
    query = query.gte('created_at', filters.start_date)
  }
  if (filters?.end_date) {
    query = query.lte('created_at', filters.end_date)
  }
  if (filters?.payment_method && filters.payment_method !== 'all') {
    query = query.eq('payment_method', filters.payment_method)
  }
  
  const { data: sales, error } = await query
  if (error) throw error
  
  if (!sales || sales.length === 0) return []
  
  // Buscar perfis dos usuários relacionados
  const userIds = [
    ...new Set([
      ...sales.map(s => s.created_by).filter(Boolean),
      ...sales.map(s => s.cancelled_by).filter(Boolean),
      ...sales.map(s => s.approved_by).filter(Boolean)
    ])
  ]
  
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    
    const profileMap = (profiles || []).reduce((acc, p) => {
      acc[p.id] = p
      return acc
    }, {})
    
    return sales.map(sale => ({
      ...sale,
      created_by_user: profileMap[sale.created_by],
      cancelled_by_user: profileMap[sale.cancelled_by],
      approved_by_user: profileMap[sale.approved_by]
    }))
  }
  
  return sales
}

/**
 * Buscar itens de uma venda
 */
export const fetchSaleItems = async (saleId) => {
  if (!saleId) {
    console.warn('⚠️ fetchSaleItems: saleId não fornecido')
    return []
  }
  
  console.log('🔍 fetchSaleItems - buscando itens para saleId:', saleId, 'tipo:', typeof saleId)
  
  // 👇 IMPORTANTE: saleId pode estar vindo como string, mas o banco espera número
  const numericSaleId = Number(saleId)
  
  const { data, error } = await supabase
    .from('sale_items')
    .select('*')
    .eq('sale_id', numericSaleId)  // 👈 Garantir que é número
  
  console.log('📦 fetchSaleItems - resposta:', { data, error })
  
  if (error) {
    console.error('❌ Erro fetchSaleItems:', error)
    throw error
  }
  
  console.log('✅ fetchSaleItems - encontrados', data?.length || 0, 'itens')
  return data || []
}

/**
 * Cancelar venda com aprovação
 */
export const cancelSaleWithApproval = async (saleNumber, cancelledBy, approvedBy, reason, notes) => {
  const { error } = await supabase.rpc('cancel_sale_with_approval', {
    p_sale_number: saleNumber,
    p_cancelled_by: cancelledBy,
    p_approved_by: approvedBy,
    p_cancellation_reason: reason,
    p_cancellation_notes: notes || null
  })
  
  if (error) throw error
  return { saleNumber }
}

/**
 * Buscar venda por ID
 */
export const fetchSaleById = async (saleId) => {
  const { data, error } = await supabase
    .from('sales')
    .select('*')
    .eq('id', saleId)
    .single()
  
  if (error) throw error
  return data
}