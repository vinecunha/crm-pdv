// src/services/dashboard/topSellersService.ts
import { supabase } from '@lib/supabase'

export interface SellerData {
  id: string
  name: string
  total: number
  count: number
  average: number
  avatar?: string
}

interface FetchTopSellersParams {
  startDate: Date
  limit?: number
}

export async function fetchTopSellers({ 
  startDate, 
  limit = 5 
}: FetchTopSellersParams): Promise<SellerData[]> {
  
  // Buscar vendas agrupadas por vendedor
  const { data: sales } = await supabase
    .from('sales')
    .select('created_by, created_by_name, final_amount')
    .gte('created_at', startDate.toISOString())
    .eq('status', 'completed')
    .not('created_by', 'is', null)

  if (!sales || sales.length === 0) return []

  // Agrupar por vendedor
  const sellerMap: Record<string, { 
    name: string
    total: number
    count: number
  }> = {}

  sales.forEach(sale => {
    const id = sale.created_by
    if (!id) return

    if (!sellerMap[id]) {
      sellerMap[id] = {
        name: sale.created_by_name || 'Vendedor',
        total: 0,
        count: 0
      }
    }
    sellerMap[id].total += Number(sale.final_amount || 0)
    sellerMap[id].count += 1
  })

  // Buscar avatares dos vendedores
  const sellerIds = Object.keys(sellerMap)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', sellerIds)

  // Mapear nomes e avatares
  const profileMap = new Map(
    profiles?.map(p => [p.id, { name: p.full_name, avatar: p.avatar_url }]) || []
  )

  // Converter para array e ordenar
  return Object.entries(sellerMap)
    .map(([id, data]) => {
      const profile = profileMap.get(id)
      return {
        id,
        name: profile?.name || data.name,
        total: Math.round(data.total * 100) / 100,
        count: data.count,
        average: Math.round((data.total / data.count) * 100) / 100,
        avatar: profile?.avatar
      }
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}