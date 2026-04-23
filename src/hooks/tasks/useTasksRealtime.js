// src/hooks/useTasksRealtime.js
import { useRealtime } from '@/hooks/utils/useRealTime'
import { useAuth } from '@contexts/AuthContext'

export const useTasksRealtime = (enabled = true) => {
  const { profile } = useAuth()

  // Assinar novas tarefas e atualizações
  useRealtime({
    table: 'tasks',
    event: '*',
    invalidateQueries: [['tasks']],
    onChange: (payload) => {
      const task = payload.new || payload.old
      
      // Notificar se tarefa foi atribuída ao usuário atual
      if (payload.eventType === 'UPDATE' && 
          payload.new.assigned_to?.includes(profile?.id) &&
          !payload.old.assigned_to?.includes(profile?.id)) {
        console.log(`📋 Nova tarefa atribuída: ${task.title}`)
        // Aqui poderia disparar uma notificação toast
      }
      
      // Notificar se tarefa foi concluída
      if (payload.eventType === 'UPDATE' && 
          payload.new.status === 'completed' &&
          payload.old.status !== 'completed') {
        console.log(`✅ Tarefa concluída: ${task.title}`)
      }
    },
    enabled
  })
}
