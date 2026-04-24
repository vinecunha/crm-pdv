// src/services/search/searchProducts.ts
import { supabase } from '@lib/supabase'
import { SearchResult, SearchFilters } from '@/types/search'
import { Package } from '@lib/icons'

export async function searchProducts(filters: SearchFilters): Promise<SearchResult[]> {
  const { query, limit = 5 } = filters
  const searchTerm = `%${query}%`

  const { data } = await supabase
    .from('products')
    .select('id, name, code, price')
    .or(`name.ilike.${searchTerm},code.ilike.${searchTerm}`)
    .eq('is_active', true)
    .order('name')
    .limit(limit)

  if (!data) return []

  return data.map((product: any) => ({
    id: product.id,
    type: 'product',
    title: product.name,
    subtitle: product.code 
      ? `Cód: ${product.code} • R$ ${product.price?.toFixed(2)}` 
      : `R$ ${product.price?.toFixed(2)}`,
    path: `/products?highlight=${product.id}`,
    icon: Package,
    category: 'Produtos',
    metadata: { code: product.code, price: product.price }
  }))
}