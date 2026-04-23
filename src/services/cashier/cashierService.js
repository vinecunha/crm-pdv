// src/services/cashierService.js
import { supabase } from '@lib/supabase'

/**
 * Buscar todos os usuários (operadores)
 */
export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .order('full_name')
  
  if (error) throw error
  return data
}

/**
 * Buscar histórico de fechamentos
 */
export const fetchClosingHistory = async () => {
  const { data, error } = await supabase
    .from('cashier_closing')
    .select('*')
    .order('closed_at', { ascending: false })
    .limit(30)
  
  if (error) throw error
  return data
}

/**
 * Buscar resumo do caixa para o período
 */
export const fetchCashierSummary = async ({ queryKey }) => {
  const [, { startDate, endDate, userId }] = queryKey
  
  const start = new Date(startDate + 'T00:00:00')
  const end = new Date(endDate + 'T23:59:59.999')
  
  const { data, error } = await supabase.rpc('get_cashier_summary', {
    p_start_date: start.toISOString(),
    p_end_date: end.toISOString(),
    p_user_id: userId === 'all' ? null : userId
  })
  
  if (error) throw error
  return data
}

/**
 * Criar fechamento de caixa
 */
export const createCashierClosing = async ({ closingData, profile }) => {
  const startDate = new Date(closingData.dateRange.start + 'T00:00:00')
  const endDate = new Date(closingData.dateRange.end + 'T23:59:59.999')
  
  const totalDeclared = closingData.declaredValues.cash + 
                       closingData.declaredValues.credit_card + 
                       closingData.declaredValues.debit_card + 
                       closingData.declaredValues.pix
  const expectedTotal = closingData.summary?.resumo?.total_liquido || 0
  const difference = totalDeclared - expectedTotal
  
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const { data, error } = await supabase
    .from('cashier_closing')
    .insert([{
      closing_date: todayStr,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      total_sales: closingData.summary?.resumo?.total_vendas || 0,
      total_discounts: closingData.summary?.resumo?.total_descontos || 0,
      total_cancellations: closingData.summary?.resumo?.total_cancelamentos || 0,
      total_cash: closingData.declaredValues.cash,
      total_card: closingData.declaredValues.credit_card + closingData.declaredValues.debit_card,
      total_pix: closingData.declaredValues.pix,
      expected_total: expectedTotal,
      declared_total: totalDeclared,
      difference: difference,
      notes: closingData.declaredValues.notes,
      closed_by: profile?.id,
      status: Math.abs(difference) < 0.01 ? 'closed' : 'adjusted',
      details: closingData.summary
    }])
    .select()
    .single()
  
  if (error) throw error
  
  return { 
    data, 
    expectedTotal, 
    totalDeclared, 
    difference 
  }
}

/**
 * Buscar detalhes de um fechamento específico
 */
export const fetchClosingDetails = async (closingId) => {
  const { data, error } = await supabase
    .from('cashier_closing')
    .select('*')
    .eq('id', closingId)
    .single()
  
  if (error) throw error
  return data
}

/**
 * Atualizar observações de um fechamento
 */
export const updateClosingNotes = async (closingId, notes) => {
  const { data, error } = await supabase
    .from('cashier_closing')
    .update({ notes, updated_at: new Date().toISOString() })
    .eq('id', closingId)
    .select()
    .single()
  
  if (error) throw error
  return data
}
