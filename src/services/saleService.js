import { supabase } from '../lib/supabase'
import { sanitizeObject } from '../utils/sanitize'
import { formatCurrency } from '../utils/formatters'

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
 * Criar venda
 */
export const createSale = async (cart, customer, coupon, discount, paymentMethod, profile) => {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - discount
  
  // Criar venda
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert([{
      customer_id: customer?.id || null,
      customer_name: customer?.name || null,
      customer_phone: customer?.phone || null,
      total_amount: subtotal,
      discount_amount: discount,
      discount_percent: coupon?.discount_type === 'percent' ? coupon.discount_value : 0,
      coupon_code: coupon?.code || null,
      final_amount: total,
      payment_method: paymentMethod,
      payment_status: 'paid',
      status: 'completed',
      created_by: profile?.id
    }])
    .select()
    .single()
    
  if (saleError) throw saleError
  
  // Criar itens da venda
  const saleItems = cart.map(item => ({
    sale_id: sale.id,
    product_id: item.id,
    product_name: item.name,
    product_code: item.code,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.total
  }))
  
  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
  if (itemsError) throw itemsError
  
  // Atualizar estoque
  for (const item of cart) {
    await supabase
      .from('products')
      .update({ 
        stock_quantity: item.stock - item.quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', item.id)
  }
  
  // Atualizar uso do cupom
  if (coupon) {
    await supabase
      .from('coupons')
      .update({ used_count: (coupon.used_count || 0) + 1 })
      .eq('id', coupon.id)
      
    if (customer) {
      await supabase
        .from('customer_coupons')
        .insert([{ coupon_id: coupon.id, customer_id: customer.id, sale_id: sale.id }])
    }
  }
  
  // Atualizar cliente
  if (customer) {
    await supabase
      .from('customers')
      .update({ 
        last_purchase: new Date().toISOString(),
        total_purchases: (customer.total_purchases || 0) + total
      })
      .eq('id', customer.id)
  }
  
  return sale
}