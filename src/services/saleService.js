import { supabase } from '@lib/supabase'
import { sanitizeObject } from '@utils/sanitize'
import { formatCurrency } from '@utils/formatters'
import { logger } from '@utils/logger'
import { notifyNewSale } from './notificationService'

// Detectar se está rodando em Node.js (testes)
const isNode = typeof window === 'undefined'
const USE_TEST_RPC = isNode || import.meta.env.VITE_USE_TEST_RPC === 'true'
const RPC_NAME = USE_TEST_RPC ? 'create_sale_test' : 'create_sale'

console.log('🔥 saleService inicializado:', { isNode, USE_TEST_RPC, RPC_NAME })

/**
 * Buscar produtos ativos com estoque
 */
export const fetchProducts = async () => {
  console.log('🔥 fetchProducts chamado')
  
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('name')
  
  console.log('📦 fetchProducts resultado:', { data, error })
  
  if (error) {
    console.error('❌ Erro fetchProducts:', error)
    throw error
  }
  
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
 * Criar venda
 */
export const createSale = async (cart, customer, coupon, discount, paymentMethod, profile) => {
  try {
    console.log('\n=== SALESERVICE - DADOS RECEBIDOS ===')
    console.log('customer?.id:', customer?.id)
    console.log('profile?.id:', profile?.id)
    console.log('RPC_NAME:', RPC_NAME)
    
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
    const total = subtotal - discount
    
    const itemsJson = cart.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      unit_price: item.price
    }))
    
    const rpcParams = {
      p_customer_id: customer?.id || null,
      p_created_by: profile?.id,
      p_items: itemsJson,
      p_payment_method: paymentMethod,
      p_discount_amount: discount,
      p_coupon_code: coupon?.code || null,
      p_notes: null
    }
    
    console.log('rpcParams:', JSON.stringify(rpcParams, null, 2))
    console.log('=====================================\n')
    
    const { data, error } = await supabase.rpc(RPC_NAME, rpcParams)
    
    console.log('RPC data:', data)
    console.log('RPC error:', error)
      
    if (error) {
      logger.error('❌ Erro na RPC:', error)
      throw error
    }
    
    if (!data) {
      logger.error('❌ RPC retornou null/undefined')
      throw new Error('Erro ao criar venda: resposta vazia')
    }
    
    // Verificar se houve erro na RPC
    if (data.error) {
      logger.error('❌ RPC retornou erro:', data)
      throw new Error(data.error)
    }
    
    logger.log('✅ Venda criada com sucesso:', data)
    
    // Extrair dados da venda
    const saleData = data
    
    const sale = {
      id: saleData.id,
      sale_number: saleData.sale_number,
      total_amount: saleData.total_amount || subtotal,
      discount_amount: saleData.discount_amount || discount,
      final_amount: saleData.final_amount || total
    }
    
    // Notificar vendas grandes
    if (sale.final_amount >= 500) {
      try {
        await notifyNewSale(sale, profile?.full_name || 'Vendedor')
      } catch (notifError) {
        logger.warn('⚠️ Erro ao notificar venda:', notifError)
      }
    }
    
    return sale
    
  } catch (error) {
    logger.error('❌ Erro em createSale:', error)
    throw error
  }
}