// src/services/search/searchUsers.ts
import { supabase } from '@lib/supabase'
import { SearchResult, SearchFilters } from '@/types/search'
import { User } from '@lib/icons'

export async function searchUsers(filters: SearchFilters): Promise<SearchResult[]> {
  const { query, role, limit = 3 } = filters

  // Apenas admin pode buscar usuários
  if (role !== 'admin') return []

  const searchTerm = `%${query}%`

  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, email, role')
    .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
    .order('full_name')
    .limit(limit)

  if (!data) return []

  return data.map((user: any) => ({
    id: user.id,
    type: 'user',
    title: user.full_name || user.email,
    subtitle: `${user.role || 'operador'} • ${user.email}`,
    path: `/users?highlight=${user.id}`,
    icon: User,
    category: 'Usuários',
    metadata: { email: user.email, role: user.role }
  }))
}