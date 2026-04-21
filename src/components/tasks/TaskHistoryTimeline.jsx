import React from 'react'
import { 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  CheckCircle, 
  Circle, 
  Clock,
  Play,
  Pause,
  RotateCcw
} from '../../lib/icons'
import { formatDateTime } from '../../utils/formatters'

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed': return <CheckCircle size={14} className="text-green-500" />
    case 'in_progress': return <Play size={14} className="text-blue-500" />
    case 'pending': return <Clock size={14} className="text-yellow-500" />
    default: return <Circle size={14} className="text-gray-400" />
  }
}

const getStatusLabel = (status) => {
  const labels = {
    pending: 'Pendente',
    in_progress: 'Em andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada'
  }
  return labels[status] || status
}

const getActionIcon = (action) => {
  switch (action) {
    case 'assigned': return <UserPlus size={14} className="text-blue-500" />
    case 'unassigned': return <UserMinus size={14} className="text-orange-500" />
    case 'claimed': return <UserCheck size={14} className="text-green-500" />
    default: return <Clock size={14} className="text-gray-400" />
  }
}

const getActionLabel = (action) => {
  const labels = {
    assigned: 'atribuiu para',
    unassigned: 'removeu',
    claimed: 'assumiu a tarefa'
  }
  return labels[action] || action
}

const TaskHistoryTimeline = ({ history, task }) => {
  if (!history) return null
  
  const { assignments = [], status_changes = [] } = history
  
  // Combinar todos os eventos e ordenar por data
  const allEvents = [
    // Criação da tarefa
    ...(task ? [{
      type: 'created',
      user_name: task.created_by_name || 'Sistema',
      user_id: task.created_by,
      created_at: task.created_at,
      title: task.title
    }] : []),
    
    // Atribuições
    ...assignments.map(a => ({
      type: 'assignment',
      ...a
    })),
    
    // Mudanças de status
    ...status_changes.map(s => ({
      type: 'status_change',
      ...s
    }))
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
      {allEvents.map((event, index) => {
        const isLast = index === allEvents.length - 1
        
        return (
          <div key={event.id || `event-${index}`} className="relative">
            <div className="flex gap-3">
              {/* Linha do tempo */}
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  {event.type === 'created' && <Clock size={14} className="text-purple-500" />}
                  {event.type === 'assignment' && getActionIcon(event.action)}
                  {event.type === 'status_change' && getStatusIcon(event.new_status)}
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1" />
                )}
              </div>
              
              {/* Conteúdo */}
              <div className="flex-1 pb-3">
                {event.type === 'created' && (
                  <>
                    <p className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{event.user_name}</span> criou a tarefa
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      "{event.title}"
                    </p>
                  </>
                )}
                
                {event.type === 'assignment' && (
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{event.assigned_by_name || 'Sistema'}</span>{' '}
                    {getActionLabel(event.action)}{' '}
                    <span className="font-medium">{event.assigned_to_name}</span>
                    {event.action === 'claimed' && ' mesma'}
                  </p>
                )}
                
                {event.type === 'status_change' && (
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{event.changed_by_name || 'Sistema'}</span>{' '}
                    moveu de{' '}
                    <span className="inline-flex items-center gap-1">
                      {getStatusIcon(event.old_status)}
                      {getStatusLabel(event.old_status)}
                    </span>{' '}
                    para{' '}
                    <span className="inline-flex items-center gap-1">
                      {getStatusIcon(event.new_status)}
                      {getStatusLabel(event.new_status)}
                    </span>
                  </p>
                )}
                
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {formatDateTime(event.created_at)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default TaskHistoryTimeline