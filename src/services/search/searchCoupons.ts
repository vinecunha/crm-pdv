// src/services/search/searchCoupons.ts
import { supabase } from '@lib/supabase'
import { SearchResult, SearchFilters } from '@/types/search'
import { Ticket } from '@lib/icons'

export async function searchCoupons(filters: SearchFilters): Promise<SearchResult[]> {
  const { query, limit = 3 } = filters
  const searchTerm = `%${query}%`

  const { data } = await supabase
    .from('coupons')
    .select('id, code, name, discount_type, discount_value')
    .or(`code.ilike.${searchTerm},name.ilike.${searchTerm}`)
    .eq('is_active', true)
    .order('name')
    .limit(limit)

  if (!data) return []

  return data.map((coupon: any) => ({
    id: coupon.id,
    type: 'coupon',
    title: coupon.name,
    subtitle: `Código: ${coupon.code} • ${
      coupon.discount_type === 'percent' 
        ? `${coupon.discount_value}%` 
        : `R$ ${coupon.discount_value}`
    }`,
    path: `/coupons?highlight=${coupon.id}`,
    icon: Ticket,
    category: 'Cupons',
    metadata: { code: coupon.code, discount_type: coupon.discount_type, discount_value: coupon.discount_value }
  }))
}