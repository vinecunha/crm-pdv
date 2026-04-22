import { supabase } from '@lib/supabase'
import { sanitizeObject } from '@utils/sanitize'
import { formatCurrency } from '@utils/formatters'
import { logger } from '@utils/logger'
import { notifyNewSale } from './notificationService'
import * as goalService from '@services/goalService'

// 🔥 CORREÇÃO: Usar APENAS flag explícita - sem detecção automática de ambiente
const USE_TEST_RPC = import.meta.env.VITE_USE_TEST_RPC === 'true'

// 🛡️ Validação de segurança para produção
if (import.meta.env.PROD && USE_TEST_RPC) {
  console.error('🚨 ERRO FATAL: VITE_USE_TEST_RPC ativado em produção!')
  console.error('⚠️ Isso pode causar uso incorreto da RPC de teste em ambiente real')
  // Opcional: throw new Error('Configuração inválida para ambiente de produção')
}

// 📝 Função segura para obter o nome da RPC (decisão em runtime)
const getRPCName = () => {
  // Em produção, SEMPRE usa a RPC de produção
  if (import.meta.env.PROD) {
    return 'create_sale'
  }
  
  // Em desenvolvimento, respeita a flag explícita
  if (import.meta.env.DEV && USE_TEST_RPC) {
    return 'create_sale_test'
  }
  
  // Padrão: RPC de produção
  return 'create_sale'
}

console.log('🔥 saleService inicializado:', { 
  mode: import.meta.env.MODE,
  isProd: import.meta.env.PROD,
  isDev: import.meta.env.DEV,
  USE_TEST_RPC, 
  currentRPC: getRPCName()
})

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
  if (!customerId) {
    console.log('❌ fetchAvailableCoupons: customerId não fornecido')
    return []
  }
  
  const today = new Date().toISOString()
  console.log('🔍 Buscando cupons disponíveis para:', { customerId, today })
  
  try {
    const [globalResult, allowedResult] = await Promise.all([
      // Cupons globais válidos
      supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .eq('is_global', true)
        .lte('valid_from', today)
        .or(`valid_to.is.null,valid_to.gte.${today}`),
        
      // IDs dos cupons específicos do cliente
      supabase
        .from('coupon_allowed_customers')
        .select('coupon_id')
        .eq('customer_id', customerId)
    ])
    
    if (globalResult.error) {
      console.error('❌ Erro ao buscar cupons globais:', globalResult.error)
    }
    
    if (allowedResult.error) {
      console.error('❌ Erro ao buscar permissões de cupons:', allowedResult.error)
    }
    
    let restricted = []
    if (allowedResult.data?.length) {
      const couponIds = allowedResult.data.map(a => a.coupon_id)
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true)
        .in('id', couponIds)
        .lte('valid_from', today)
        .or(`valid_to.is.null,valid_to.gte.${today}`)
      
      if (error) {
        console.error('❌ Erro ao buscar cupons específicos:', error)
      } else {
        restricted = data || []
      }
    }
    
    const allCoupons = [...(globalResult.data || []), ...restricted]
    
    console.log(`✅ ${allCoupons.length} cupons encontrados:`, {
      globais: globalResult.data?.length || 0,
      especificos: restricted.length
    })
    
    return allCoupons
    
  } catch (error) {
    console.error('❌ Erro inesperado em fetchAvailableCoupons:', error)
    return []
  }
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
    // 🎯 Decisão da RPC no momento da chamada
    const rpcName = getRPCName()
    
    console.log('\n=== SALESERVICE - DADOS RECEBIDOS ===')
    console.log('customer?.id:', customer?.id)
    console.log('profile?.id:', profile?.id)
    console.log('RPC_NAME:', rpcName)
    console.log('Ambiente:', import.meta.env.MODE)
    
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
    
    const { data, error } = await supabase.rpc(rpcName, rpcParams)
    
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
  
    if (data && profile?.id) {
      await goalService.updateGoalProgress(profile.id, data.final_amount)
    }

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