// src/services/search/searchSales.ts
import { supabase } from '@lib/supabase'
import { SearchResult, SearchFilters } from '@/types/search'
import { ShoppingBag } from '@lib/icons'

export async function searchSales(filters: SearchFilters): Promise<SearchResult[]> {
  const { query, limit = 5 } = filters
  const searchTerm = `%${query}%`

  const { data } = await supabase
    .from('sales')
    .select('id, sale_number, customer_name, final_amount, created_at')
    .or(`sale_number.ilike.${searchTerm},customer_name.ilike.${searchTerm}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.map((sale: any) => ({
    id: sale.id,
    type: 'sale',
    title: `Venda #${sale.sale_number}`,
    subtitle: `${sale.customer_name || 'Cliente não identificado'} • R$ ${sale.final_amount?.toFixed(2)}`,
    path: `/sales-list?highlight=${sale.id}`,
    icon: ShoppingBag,
    category: 'Vendas',
    metadata: { sale_number: sale.sale_number, final_amount: sale.final_amount }
  }))
}