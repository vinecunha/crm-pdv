import { supabase } from '../lib/supabase'
import { sanitizeObject } from '../utils/sanitize'
import { formatCurrency } from '../utils/formatters'
import { logger } from '../utils/logger'

/**
 * Buscar produtos ativos com estoque
 */
export const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('name')
  
  if (error) throw error
  return data || []
}

/**
 * Buscar cupons disponíveis para o cliente
 */
export const fetchAvailableCoupons = async (customerId) => {
  if (!customerId) return []
  
  const today = new Date().toISOString()
  
  const [globalResult, allowedResult] = await Promise.all([
    supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .eq('is_global', true)
      .lte('valid_from', today)
      .gte('valid_to', today),
    supabase
      .from('coupon_allowed_customers')
      .select('coupon_id')
      .eq('customer_id', customerId)
  ])
  
  let restricted = []
  if (allowedResult.data?.length) {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .in('id', allowedResult.data.map(a => a.coupon_id))
      .lte('valid_from', today)
      .gte('valid_to', today)
    restricted = data || []
  }
  
  return [...(globalResult.data || []), ...restricted]
}

/**
 * Buscar cliente por telefone
 */
export const searchCustomerByPhone = async (phone) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('phone', phone.replace(/\D/g, ''))
    .maybeSingle()
    
  if (error) throw error
  return data
}

/**
 * Criar cliente
 */
export const createCustomer = async (customerData) => {
  const safeData = sanitizeObject(customerData)
  
  const { data, error } = await supabase
    .from('customers')
    .insert([{ 
      ...safeData, 
      phone: safeData.phone.replace(/\D/g, ''),
      status: 'active',
      total_purchases: 0
    }])
    .select()
    .single()
    
  if (error) throw error
  return data
}

/**
 * Validar cupom
 */
export const validateCoupon = async (code, customerId, cartSubtotal) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()
    
  if (error) throw new Error('Cupom inválido')
  
  const today = new Date()
  if (data.valid_from && today < new Date(data.valid_from)) {
    throw new Error('Cupom ainda não está válido')
  }
  if (data.valid_to && today > new Date(data.valid_to)) {
    throw new Error('Cupom expirado')
  }
  if (data.usage_limit && data.used_count >= data.usage_limit) {
    throw new Error('Cupom esgotado')
  }
  if (cartSubtotal < (data.min_purchase || 0)) {
    throw new Error(`Valor mínimo: ${formatCurrency(data.min_purchase)}`)
  }
  
  if (!data.is_global) {
    const { data: allowed } = await supabase
      .from('coupon_allowed_customers')
      .select('*')
      .eq('coupon_id', data.id)
      .eq('customer_id', customerId)
      .maybeSingle()
      
    if (!allowed) {
      throw new Error('Cupom não disponível para este cliente')
    }
  }
  
  let discountValue = data.discount_type === 'percent' 
    ? (cartSubtotal * data.discount_value) / 100 
    : data.discount_value
    
  if (data.discount_type === 'percent' && data.max_discount) {
    discountValue = Math.min(discountValue, data.max_discount)
  }
  discountValue = Math.min(discountValue, cartSubtotal)
  
  return { coupon: data, discountValue }
}

/**
 * Criar venda (USANDO RPC - VERSÃO CORRIGIDA)
 */
export const createSale = async (cart, customer, coupon, discount, paymentMethod, profile) => {
  try {
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    const total = subtotal - discount
    
    // Determinar status baseado no método de pagamento
    const isPix = paymentMethod === 'pix'
    const paymentStatus = isPix ? 'pending' : 'paid'
    const saleStatus = isPix ? 'pending' : 'completed'
    
    // Preparar itens para JSONB
    const itemsJson = cart.map(item => ({
      product_id: item.id,
      product_name: item.name,
      product_code: item.code,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.total
    }))
    
    logger.log('🔥 Chamando RPC create_sale_complete', {
      paymentMethod,
      itemsCount: itemsJson.length,
      total
    })
    
    // 🔥 CHAMAR A RPC (UMA ÚNICA CHAMADA)
    const { data, error } = await supabase
      .rpc('create_sale_complete', {
        p_customer_id: customer?.id || null,
        p_customer_name: customer?.name || 'Cliente não identificado',
        p_customer_phone: customer?.phone || null,
        p_total_amount: subtotal,
        p_discount_amount: discount,
        p_discount_percent: coupon?.discount_type === 'percent' ? coupon.discount_value : 0,
        p_coupon_code: coupon?.code || null,
        p_final_amount: total,
        p_payment_method: paymentMethod,
        p_payment_status: paymentStatus,
        p_status: saleStatus,
        p_created_by: profile?.id,
        p_items: itemsJson
      })
      
    if (error) {
      logger.error('❌ Erro na RPC:', error)
      throw error
    }
    
    if (!data.success) {
      logger.error('❌ RPC falhou:', data)
      throw new Error(data.error || 'Erro ao criar venda')
    }
    
    logger.log('✅ Venda criada com sucesso:', data)
    
    // Retornar objeto compatível com o formato esperado
    return {
      id: data.sale_id,
      sale_number: data.sale_number,
      total_amount: subtotal,
      discount_amount: discount,
      final_amount: total
    }
    
  } catch (error) {
    logger.error('❌ Erro em createSale:', error)
    throw error
  }
}