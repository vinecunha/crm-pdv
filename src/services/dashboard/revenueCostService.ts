// src/services/dashboard/revenueCostService.ts
import { supabase } from '@lib/supabase'

export interface RevenueCostData {
  month: string
  revenue: number
  cost: number
  profit: number
}

interface FetchRevenueCostParams {
  period?: '6months' | '12months' | 'thisYear'
  userId?: string
  role?: string
}

export async function fetchRevenueCostData({ 
  period = '6months',
  userId,
  role 
}: FetchRevenueCostParams = {}): Promise<RevenueCostData[]> {
  
  const now = new Date()
  let startDate: Date
  
  switch (period) {
    case '12months':
      startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1)
      break
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1)
      break
    case '6months':
    default:
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      break
  }

  // =============================================
  // 1. RECEITAS - Vendas concluídas
  // =============================================
  let salesQuery = supabase
    .from('sales')
    .select('id, final_amount, created_at')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
    .order('created_at')

  if (role === 'operador' && userId) {
    salesQuery = salesQuery.eq('created_by', userId)
  }

  const { data: sales } = await salesQuery

  // =============================================
  // 2. CUSTOS - Custo real das vendas (CMV)
  // Buscar os produtos vendidos e seu custo
  // =============================================
  const saleIds = sales?.map(s => s.id) || []
  
  let costData: { month: string; cost: number }[] = []

  if (saleIds.length > 0) {
    // Buscar itens das vendas com o custo do produto
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select(`
        quantity,
        unit_price,
        total_price,
        product_id,
        sale_id,
        sales!inner(created_at)
      `)
      .in('sale_id', saleIds)

    if (saleItems) {
      // Para cada item vendido, buscar o custo do produto
      const productIds = [...new Set(saleItems.map(item => item.product_id))]
      
      const { data: products } = await supabase
        .from('products')
        .select('id, cost_price')
        .in('id', productIds)

      const productCostMap = new Map(
        products?.map(p => [p.id, p.cost_price || 0]) || []
      )

      // Calcular custo total por mês
      const monthlyCost: Record<string, number> = {}
      
      saleItems.forEach(item => {
        const saleDate = (item as any).sales?.created_at
        if (saleDate) {
          const date = new Date(saleDate)
          const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
          
          const unitCost = productCostMap.get(item.product_id) || 0
          const totalCost = unitCost * Number(item.quantity)
          
          monthlyCost[monthKey] = (monthlyCost[monthKey] || 0) + totalCost
        }
      })

      costData = Object.entries(monthlyCost).map(([month, cost]) => ({
        month,
        cost
      }))
    }
  }

  // =============================================
  // 3. COMISSÕES (custo adicional)
  // =============================================
  let commissionsQuery = supabase
    .from('commissions')
    .select('amount, created_at')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'paid')
    .order('created_at')

  const { data: commissions } = await commissionsQuery

  // =============================================
  // 4. AGRUPAR POR MÊS
  // =============================================
  const monthlyData: Record<string, { revenue: number; cost: number }> = {}
  
  // Inicializar meses
  const numMonths = period === '12months' ? 12 : period === 'thisYear' ? 12 : 6
  for (let i = 0; i < numMonths; i++) {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + i)
    const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    monthlyData[monthKey] = { revenue: 0, cost: 0 }
  }

  // Somar receitas
  sales?.forEach(sale => {
    if (sale.created_at && sale.final_amount) {
      const date = new Date(sale.created_at)
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += Number(sale.final_amount)
      }
    }
  })

  // Somar custos das mercadorias vendidas
  costData.forEach(({ month, cost }) => {
    if (monthlyData[month]) {
      monthlyData[month].cost += cost
    }
  })

  // Somar comissões pagas
  commissions?.forEach(commission => {
    if (commission.created_at && commission.amount) {
      const date = new Date(commission.created_at)
      const monthKey = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].cost += Number(commission.amount)
      }
    }
  })

  // Converter para array
  return Object.entries(monthlyData).map(([month, data]) => ({
    month: month.replace('.', ''),
    revenue: Math.round(data.revenue * 100) / 100,
    cost: Math.round(data.cost * 100) / 100,
    profit: Math.round((data.revenue - data.cost) * 100) / 100
  }))
}