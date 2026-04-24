// src/services/search/searchCustomers.ts
import { supabase } from '@lib/supabase'
import { SearchResult, SearchFilters } from '@/types/search'
import { Users } from '@lib/icons'

export async function searchCustomers(filters: SearchFilters): Promise<SearchResult[]> {
  const { query, limit = 5 } = filters
  const searchTerm = `%${query}%`

  const { data } = await supabase
    .from('customers')
    .select('id, name, email, phone')
    .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm}`)
    .eq('status', 'active')
    .order('name')
    .limit(limit)

  if (!data) return []

  return data.map((customer: any) => ({
    id: customer.id,
    type: 'customer',
    title: customer.name,
    subtitle: customer.email || customer.phone || 'Sem contato',
    path: `/customers?highlight=${customer.id}`,
    icon: Users,
    category: 'Clientes',
    metadata: { email: customer.email, phone: customer.phone }
  }))
}