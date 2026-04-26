// src/services/dashboard/paymentMethodsService.ts
import { supabase } from '@lib/supabase'

export interface PaymentMethodData {
  method: string
  total: number
  percentage: number
  count: number
}

interface FetchPaymentMethodsParams {
  startDate: Date
  userId?: string
  role?: string
}

export async function fetchPaymentMethods({ 
  startDate, 
  userId, 
  role 
}: FetchPaymentMethodsParams): Promise<PaymentMethodData[]> {
  
  let query = supabase
    .from('sales')
    .select('payment_method, final_amount')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
    .not('payment_method', 'is', null)

  // Filtrar por operador
  if (role === 'operador' && userId) {
    query = query.eq('created_by', userId)
  }

  const { data: sales } = await query

  if (!sales || sales.length === 0) return []

  // Mapear métodos de pagamento para nomes amigáveis
  const methodNames: Record<string, string> = {
    'cash': 'Dinheiro',
    'credit_card': 'Cartão de Crédito',
    'debit_card': 'Cartão de Débito',
    'pix': 'PIX',
    'credit': 'Fiado',
    'other': 'Outros'
  }

  // Agrupar por método
  const methodMap: Record<string, { total: number; count: number }> = {}

  sales.forEach(sale => {
    const method = sale.payment_method || 'other'
    const name = methodNames[method] || method

    if (!methodMap[name]) {
      methodMap[name] = { total: 0, count: 0 }
    }
    methodMap[name].total += Number(sale.final_amount || 0)
    methodMap[name].count += 1
  })

  const totalAmount = Object.values(methodMap).reduce((sum, m) => sum + m.total, 0)

  // Converter para array e ordenar
  return Object.entries(methodMap)
    .map(([method, data]) => ({
      method,
      total: Math.round(data.total * 100) / 100,
      percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
      count: data.count
    }))
    .sort((a, b) => b.total - a.total)
}