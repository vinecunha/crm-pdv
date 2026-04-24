// src/services/search/searchBudgets.ts
import { supabase } from '@lib/supabase'
import { SearchResult, SearchFilters } from '@/types/search'
import { FileText } from '@lib/icons'

export async function searchBudgets(filters: SearchFilters): Promise<SearchResult[]> {
  const { query, limit = 5 } = filters
  const searchTerm = `%${query}%`

  const { data } = await supabase
    .from('budgets')
    .select('id, budget_number, customer_name, final_amount')
    .or(`budget_number.ilike.${searchTerm},customer_name.ilike.${searchTerm}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.map((budget: any) => ({
    id: budget.id,
    type: 'budget',
    title: `Orçamento #${budget.budget_number}`,
    subtitle: `${budget.customer_name || 'Cliente não identificado'} • R$ ${budget.final_amount?.toFixed(2)}`,
    path: `/budgets?highlight=${budget.id}`,
    icon: FileText,
    category: 'Orçamentos',
    metadata: { budget_number: budget.budget_number, final_amount: budget.final_amount }
  }))
}