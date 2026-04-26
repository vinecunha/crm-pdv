import React, { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'
import Modal from '@components/ui/Modal'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import TaskHistoryTimeline from '@components/tasks/TaskHistoryTimeline'
import { History, Users, GitBranch } from '@lib/icons'
import { logger } from '@utils/logger'

const TaskHistoryModal = ({ isOpen, onClose, task }) => {
  const [history, setHistory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('timeline')
  
  useEffect(() => {
    if (isOpen && task?.id) {
      fetchHistory()
    }
  }, [isOpen, task?.id])
  
  const fetchHistory = async () => {
    setLoading(true)
    
    try {
      const { data, error } = await supabase.rpc('fetch_task_history', {
        p_task_id: task.id
      })
      
      if (error) throw error
      setHistory(data)
    } catch (error) {
      logger.error('Erro ao buscar histórico:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const tabs = [
    { id: 'timeline', label: 'Linha do Tempo', icon: History },
    { id: 'assignments', label: 'Atribuições', icon: Users },
    { id: 'status', label: 'Status', icon: GitBranch }
  ]
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Histórico: ${task?.title || 'Tarefa'}`}
      size="lg"
    >
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
      </div>
      
      {/* Conteúdo */}
      {loading ? (
        <DataLoadingSkeleton type="cards" rows={3} cardsPerRow={1} />
      ) : (
        <>
          {activeTab === 'timeline' && (
            <TaskHistoryTimeline history={history} task={task} />
          )}
          
          {activeTab === 'assignments' && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(history?.assignments || []).map((assignment, index) => (
                <div key={assignment.id || index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      assignment.action === 'assigned' ? 'bg-blue-500' :
                      assignment.action === 'unassigned' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`} />
                    <span className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{assignment.assigned_by_name}</span>{' '}
                      {assignment.action === 'assigned' ? 'atribuiu para' :
                       assignment.action === 'unassigned' ? 'removeu' :
                       'assumiu'}{' '}
                      <span className="font-medium">{assignment.assigned_to_name}</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-4">
                    {formatDateTime(assignment.created_at)}
                  </p>
                </div>
              ))}
              {(!history?.assignments || history.assignments.length === 0) && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Nenhuma atribuição registrada
                </p>
              )}
            </div>
          )}
          
          {activeTab === 'status' && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(history?.status_changes || []).map((change, index) => (
                <div key={change.id || index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {getStatusIcon(change.old_status)}
                      <span className="text-sm">→</span>
                      {getStatusIcon(change.new_status)}
                    </div>
                    <span className="text-sm text-gray-900 dark:text-white">
                      <span className="font-medium">{change.changed_by_name}</span>{' '}
                      moveu para {getStatusLabel(change.new_status)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-7">
                    {formatDateTime(change.created_at)}
                  </p>
                </div>
              ))}
              {(!history?.status_changes || history.status_changes.length === 0) && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Nenhuma mudança de status registrada
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

// Helper function
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

// Import dos ícones necessários
import { CheckCircle, Circle, Clock, Play } from '@lib/icons'
import { formatDateTime } from '@utils/formatters'

export default TaskHistoryModal
