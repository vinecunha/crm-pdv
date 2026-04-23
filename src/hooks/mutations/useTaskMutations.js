// src/hooks/mutations/useTaskMutations.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@lib/supabase'

export const useTaskMutations = (callbacks = {}) => {
  const queryClient = useQueryClient()

  const {
    onTaskCreated,
    onTaskUpdated,
    onTaskDeleted,
    onError
  } = callbacks

  const createTask = useMutation({
    mutationFn: async (formData) => {
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
      return { id: data.task_id, ...formData }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onTaskCreated?.(data)
    },
    onError: (error) => onError?.(error)
  })

  const updateTask = useMutation({
    mutationFn: async ({ taskId, updates }) => {
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
      return { id: taskId, ...updates }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onTaskUpdated?.(data)
    },
    onError: (error) => onError?.(error)
  })

  const deleteTask = useMutation({
    mutationFn: async (taskId) => {
      const { data, error } = await supabase.rpc('delete_task', { p_task_id: taskId })
      if (error) throw error
      if (!data?.success) throw new Error(data?.error)
      return taskId
    },
    onSuccess: (taskId) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onTaskDeleted?.(taskId)
    },
    onError: (error) => onError?.(error)
  })

  return {
    createTask,
    updateTask,
    deleteTask,
    isMutating: createTask.isPending || updateTask.isPending || deleteTask.isPending
  }
}
