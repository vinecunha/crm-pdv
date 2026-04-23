import { useRealtime } from '@/hooks/utils/useRealTime'
import { useAuth } from '@contexts/AuthContext'

interface TaskPayload {
  new: {
    id: string
    title: string
    status: string
    assigned_to: string[] | null
    [key: string]: unknown
  }
  old: {
    assigned_to: string[] | null
    status: string
    [key: string]: unknown
  }
  eventType: string
  [key: string]: unknown
}

export const useTasksRealtime = (enabled: boolean = true): void => {
  const { profile } = useAuth()

  useRealtime({
    table: 'tasks',
    event: '*',
    onChange: (payload: unknown) => {
      const taskPayload = payload as TaskPayload
      const task = taskPayload.new || taskPayload.old
      
      if (taskPayload.eventType === 'UPDATE' && 
          taskPayload.new.assigned_to?.includes(profile?.id as string) &&
          !taskPayload.old.assigned_to?.includes(profile?.id as string)) {
        console.log(`📋 Nova tarefa atribuída: ${task.title}`)
      }
      
      if (taskPayload.eventType === 'UPDATE' && 
          taskPayload.new.status === 'completed' &&
          taskPayload.old.status !== 'completed') {
        console.log(`✅ Tarefa concluída: ${task.title}`)
      }
    },
    enabled
  })
}