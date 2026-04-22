import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export const useTasksQuery = ({ type, status, assignedTo, limit = 100 }) => {
  return useQuery({
    queryKey: ['tasks', { type, status, assignedTo, limit }],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('fetch_tasks', {
        p_type: type || null,
        p_status: status || null,
        p_priority: null,
        p_search: null
      })
      
      if (error) throw error
      
      let tasks = data || []
      
      // Filtrar por atribuição se necessário
      if (assignedTo) {
        tasks = tasks.filter(t => 
          t.assigned_to?.includes(assignedTo) || t.created_by === assignedTo
        )
      }
      
      return tasks.slice(0, limit)
    },
    staleTime: 2 * 60 * 1000,
    enabled: true
  })
}