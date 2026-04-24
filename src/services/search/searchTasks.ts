// src/services/search/searchTasks.ts
import { supabase } from '@lib/supabase'
import { SearchResult, SearchFilters } from '@/types/search'
import { ClipboardList } from '@lib/icons'

export async function searchTasks(filters: SearchFilters): Promise<SearchResult[]> {
  const { query, role, limit = 5 } = filters

  // Apenas admin e gerente podem buscar tarefas
  if (role !== 'admin' && role !== 'gerente') return []

  const searchTerm = `%${query}%`

  const { data } = await supabase
    .from('tasks')
    .select('id, title, status, priority')
    .or(`title.ilike.${searchTerm}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (!data) return []

  return data.map((task: any) => ({
    id: task.id,
    type: 'task',
    title: task.title,
    subtitle: `Prioridade: ${task.priority} • Status: ${task.status}`,
    path: `/tasks?highlight=${task.id}`,
    icon: ClipboardList,
    category: 'Tarefas',
    metadata: { status: task.status, priority: task.priority }
  }))
}