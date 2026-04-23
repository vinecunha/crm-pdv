import { useMutation, useQueryClient } from '@tanstack/react-query'
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

interface TaskFormData {
  title: string
  description: string | null
  type: 'personal' | 'team'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string[]
  assigned_to_names: string[]
  due_date: string
  category: string
}

interface TaskUpdateData {
  title?: string
  description?: string | null
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  assigned_to?: string[]
  assigned_to_names?: string[]
  due_date?: string
}

interface TaskCallbacks {
  onTaskCreated?: (data: Task) => void
  onTaskUpdated?: (data: Task) => void
  onTaskDeleted?: (taskId: string) => void
  onError?: (error: Error) => void
}

interface UseTaskMutationsReturn {
  createTask: ReturnType<typeof useMutation>
  updateTask: ReturnType<typeof useMutation>
  deleteTask: ReturnType<typeof useMutation>
  isMutating: boolean
}

export const useTaskMutations = (callbacks: TaskCallbacks = {}): UseTaskMutationsReturn => {
  const queryClient = useQueryClient()

  const {
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onError
  } = callbacks

  const createTask = useMutation({
    mutationFn: async (formData: TaskFormData): Promise<Task> => {
      const { data, error } = await supabase.rpc('create_task_final', {
        p_title: formData.title,
        p_description: formData.description,
        p_type: formData.type,
        p_priority: formData.priority,
        p_assigned_to: formData.assigned_to,
        p_assigned_to_names: formData.assigned_to_names,
        p_due_date: formData.due_date,
        p_category: formData.category
      })
      if (error) throw error
      if (!data.success) throw new Error(data.error)
      return { id: data.task_id, ...formData } as Task
    },
    onSuccess: (data: Task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onTaskCreated?.(data)
    },
    onError: (error: Error) => onError?.(error)
  })

  const updateTask = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: TaskUpdateData }): Promise<Task> => {
      const { data, error } = await supabase.rpc('update_task', {
        p_task_id: taskId,
        p_title: updates.title,
        p_description: updates.description,
        p_priority: updates.priority,
        p_status: updates.status,
        p_assigned_to: updates.assigned_to,
        p_assigned_to_names: updates.assigned_to_names,
        p_due_date: updates.due_date
      })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error)
      return { id: taskId, ...updates } as Task
    },
    onSuccess: (data: Task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onTaskUpdated?.(data)
    },
    onError: (error: Error) => onError?.(error)
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId: string): Promise<string> => {
      const { data, error } = await supabase.rpc('delete_task', { p_task_id: taskId })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error)
      return taskId
    },
    onSuccess: (taskId: string) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onTaskDeleted?.(taskId)
    },
    onError: (error: Error) => onError?.(error)
  })

  return {
    createTask,
    updateTask,
    deleteTask,
    isMutating: createTask.isPending || updateTask.isPending || deleteTask.isPending
  }
}