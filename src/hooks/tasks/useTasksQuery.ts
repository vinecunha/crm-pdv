import { useQuery } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

// Baseado em: public.tasks
interface Task {
  id: string
  title: string
  description: string | null
  type: 'personal' | 'team'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to: string[] | null
  assigned_to_names: string[] | null
  created_by: string | null
  created_by_name: string | null
  due_date: string | null
  completed_at: string | null
  completed_by: string | null
  category: string | null
  tags: string[] | null
  created_at: string | null
  updated_at: string | null
  visibility: 'assigned' | 'team' | 'all' | null
  assigned_by: string | null
  assigned_by_name: string | null
}

interface UseTasksQueryParams {
  type?: 'personal' | 'team' | null
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | null
  assignedTo?: string | null
  limit?: number
}

export const useTasksQuery = ({
  type,
  status,
  assignedTo,
  limit = 100
}: UseTasksQueryParams) => {
  return useQuery<Task[]>({
    queryKey: ['tasks', { type, status, assignedTo, limit }],
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase.rpc('fetch_tasks', {
        p_type: type || null,
        p_status: status || null,
        p_priority: null,
        p_search: null
      })
      
      if (error) throw error
      
      let tasks = (data as Task[]) || []
      
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