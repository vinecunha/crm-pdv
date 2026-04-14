import { supabase } from '../lib/supabase'
import { sanitizeObject } from '../utils/sanitize'

/**
 * Buscar todos os cupons
 */
export const fetchCoupons = async (searchTerm = '', filters = {}) => {
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
  if (filters?.is_global && filters.is_global !== 'all') {
    query = query.eq('is_global', filters.is_global === 'global')
  }
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Buscar clientes ativos
 */
export const fetchCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, name, phone, email')
    .eq('status', 'active')
    .order('name')
  
  if (error) throw error
  return data || []
}

/**
 * Buscar clientes permitidos para um cupom
 */
export const fetchAllowedCustomers = async (couponId) => {
  if (!couponId) return []
  
  const { data, error } = await supabase
    .from('coupon_allowed_customers')
    .select('customer_id, customers(id, name, phone, email)')
    .eq('coupon_id', couponId)
  
  if (error) throw error
  return data || []
}

/**
 * Criar cupom
 */
export const createCoupon = async (couponData, allowedCustomers, profile) => {
  const safeData = sanitizeObject(couponData)
  
  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .insert([{ ...safeData, created_by: profile?.id }])
    .select()
    .single()
  
  if (couponError) throw couponError
  
  if (!safeData.is_global && allowedCustomers?.length > 0) {
    const { error: customersError } = await supabase
      .from('coupon_allowed_customers')
      .insert(allowedCustomers.map(customerId => ({ coupon_id: coupon.id, customer_id: customerId })))
    
    if (customersError) throw customersError
  }
  
  return coupon
}

/**
 * Atualizar cupom
 */
export const updateCoupon = async (id, couponData, allowedCustomers, profile) => {
  const safeData = sanitizeObject(couponData)
  
  const { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .update({ ...safeData, updated_by: profile?.id })
    .eq('id', id)
    .select()
    .single()
  
  if (couponError) throw couponError
  
  if (!safeData.is_global) {
    await supabase.from('coupon_allowed_customers').delete().eq('coupon_id', id)
    
    if (allowedCustomers?.length > 0) {
      const { error: customersError } = await supabase
        .from('coupon_allowed_customers')
        .insert(allowedCustomers.map(customerId => ({ coupon_id: id, customer_id: customerId })))
      
      if (customersError) throw customersError
    }
  }
  
  return coupon
}

/**
 * Excluir cupom
 */
export const deleteCoupon = async (id) => {
  const { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) throw error
  return id
}

/**
 * Alternar status do cupom
 */
export const toggleCouponStatus = async (id, currentStatus, profile) => {
  const newStatus = !currentStatus
  const { data, error } = await supabase
    .from('coupons')
    .update({ is_active: newStatus, updated_by: profile?.id })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Adicionar cliente permitido
 */
export const addAllowedCustomer = async (couponId, customer) => {
  const { error } = await supabase
    .from('coupon_allowed_customers')
    .insert([{ coupon_id: couponId, customer_id: customer.id }])
  
  if (error) throw error
  return { customer_id: customer.id, customers: customer }
}

/**
 * Remover cliente permitido
 */
export const removeAllowedCustomer = async (couponId, customerId) => {
  const { error } = await supabase
    .from('coupon_allowed_customers')
    .delete()
    .eq('coupon_id', couponId)
    .eq('customer_id', customerId)
  
  if (error) throw error
  return customerId
}