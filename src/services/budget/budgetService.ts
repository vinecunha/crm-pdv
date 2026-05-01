import { supabase } from '@lib/supabase'
import { sanitizeObject } from '@utils/sanitize'
import { formatCurrency } from '@utils/formatters'

/**
 * Buscar todos os orçamentos
 */
export const fetchBudgets = async (searchTerm = '', filters = {}) => {
  let query = supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (searchTerm?.trim()) {
    query = query.or(`budget_number::text.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`)
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }
  
  const { data, error } = await query
  if (error) throw error
  return data || []
}

/**
 * Buscar itens de um orçamento
 */
export const fetchBudgetItems = async (budgetId) => {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('budget_id', budgetId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data || []
}

/**
 * Buscar produtos ativos
 */
export const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error) throw error
  return data || []
}

/**
 * Buscar cupons disponíveis
 */
export const fetchAvailableCoupons = async (customerId) => {
  if (!customerId) return []
  
  const today = new Date().toISOString()
  
  const [globalResult, allowedResult] = await Promise.all([
    supabase.from('coupons').select('*').eq('is_active', true).eq('is_global', true).lte('valid_from', today).or(`valid_to.is.null,valid_to.gte.${today}`),
    supabase.from('coupon_allowed_customers').select('coupon_id').eq('customer_id', customerId)
  ])
  
  let restricted = []
  if (allowedResult.data?.length) {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('is_active', true)
      .in('id', allowedResult.data.map(a => a.coupon_id))
      .lte('valid_from', today)
      .or(`valid_to.is.null,valid_to.gte.${today}`)
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
    .insert([{ ...safeData, phone: safeData.phone.replace(/\D/g, ''), status: 'active', total_purchases: 0 }])
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
  if (data.valid_from && today < new Date(data.valid_from)) throw new Error('Cupom ainda não está válido')
  if (data.valid_to && today > new Date(data.valid_to)) throw new Error('Cupom expirado')
  if (data.usage_limit && data.used_count >= data.usage_limit) throw new Error('Cupom esgotado')
  if (cartSubtotal < (data.min_purchase || 0)) throw new Error(`Valor mínimo: ${formatCurrency(data.min_purchase)}`)
  
  if (!data.is_global) {
    const { data: allowed } = await supabase
      .from('coupon_allowed_customers')
      .select('*')
      .eq('coupon_id', data.id)
      .eq('customer_id', customerId)
      .maybeSingle()
    if (!allowed) throw new Error('Cupom não disponível para este cliente')
  }
  
  let discountValue = data.discount_type === 'percent' ? (cartSubtotal * data.discount_value) / 100 : data.discount_value
  if (data.discount_type === 'percent' && data.max_discount) discountValue = Math.min(discountValue, data.max_discount)
  discountValue = Math.min(discountValue, cartSubtotal)
  
  return { coupon: data, discountValue }
}

/**
 * Criar orçamento
 */
export const createBudget = async (cart, customer, coupon, discount, profile, notes, validUntil) => {
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0)
  const total = subtotal - discount
  
  const { data: budget, error: budgetError } = await supabase
    .from('budgets')
    .insert([{
      customer_id: customer?.id || null,
      customer_name: customer?.name || 'Cliente não identificado',
      customer_phone: customer?.phone || null,
      customer_email: customer?.email || null,
      total_amount: subtotal,
      discount_amount: discount,
      discount_percent: coupon?.discount_type === 'percent' ? coupon.discount_value : 0,
      coupon_code: coupon?.code || null,
      final_amount: total,
      status: 'pending',
      valid_until: validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: notes || null,
      created_by: profile?.id
    }])
    .select()
    .single()
    
  if (budgetError) throw budgetError
  
  const budgetItems = cart.map(item => ({
    budget_id: budget.id,
    product_id: item.id,
    product_name: item.name,
    product_code: item.code,
    quantity: item.quantity,
    unit_price: item.price,
    total_price: item.total,
    unit: item.unit
  }))
  
  const { error: itemsError } = await supabase.from('budget_items').insert(budgetItems)
  if (itemsError) throw itemsError
  
  return budget
}

/**
 * Atualizar status do orçamento
 */
export const updateBudgetStatus = async (id, status, profile) => {
  const updateData = { status, updated_at: new Date().toISOString() }
  if (status === 'approved') {
    updateData.approved_by = profile?.id
    updateData.approved_at = new Date().toISOString()
  }
  
  const { data, error } = await supabase.from('budgets').update(updateData).eq('id', id).select().single()
  if (error) throw error
  return data
}

/**
 * Converter orçamento em venda
 */
export const convertBudgetToSale = async (budget, budgetItems, profile) => {
  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert([{
      customer_id: budget.customer_id,
      customer_name: budget.customer_name,
      customer_phone: budget.customer_phone,
      total_amount: budget.total_amount,
      discount_amount: budget.discount_amount,
      discount_percent: budget.discount_percent,
      coupon_code: budget.coupon_code,
      final_amount: budget.final_amount,
      payment_method: 'cash',
      payment_status: 'paid',
      status: 'completed',
      created_by: profile?.id
    }])
    .select()
    .single()
    
  if (saleError) throw saleError
  
  const saleItems = budgetItems.map(item => ({
    sale_id: sale.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_code: item.product_code,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.total_price
  }))
  
  const { error: itemsError } = await supabase.from('sale_items').insert(saleItems)
  if (itemsError) throw itemsError
  
  await supabase.rpc('convert_budget_to_sale', {
    p_budget_id: budget.id,
    p_items: budgetItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }))
  })
  
  await supabase.from('budgets').update({ status: 'converted', converted_sale_id: sale.id, updated_at: new Date().toISOString() }).eq('id', budget.id)
  
  if (budget.customer_id) {
    const { data: customer } = await supabase.from('customers').select('total_purchases').eq('id', budget.customer_id).single()
    const newTotal = (customer?.total_purchases || 0) + Number(budget.final_amount)
    await supabase.from('customers').update({ 
      last_purchase: new Date().toISOString(), 
      total_purchases: newTotal 
    }).eq('id', budget.customer_id)
  }
  
  return sale
}
