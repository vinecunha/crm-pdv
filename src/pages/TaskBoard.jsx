import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { Plus, RefreshCw, Users, CheckCircle, User, ClipboardList } from '@lib/icons'
import PageHeader from '@components/ui/PageHeader'
import DataFilters from '@components/ui/DataFilters'
import DataEmptyState from '@components/ui/DataEmptyState'
import DataLoadingSkeleton from '@components/ui/DataLoadingSkeleton'
import TaskCard from '@components/tasks/TaskCard'
import TaskModal from '@components/tasks/TaskModal'
import ConfirmModal from '@components/ui/ConfirmModal'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import TaskHistoryModal from '@components/tasks/TaskHistoryModal'
import { useTasksQuery } from '@hooks/useTasksQuery'
import { useTasksRealtime } from '@hooks/useTasksRealtime'

const TaskBoard = () => {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('team')
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [historyTask, setHistoryTask] = useState(null)
  const [showHistoryModal, setShowHistoryModal] = useState(false)

  useTasksRealtime(!loading)
  
  // Estados para ConfirmModal e Feedback
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    taskId: null,
    taskTitle: ''
  })
  const [feedback, setFeedback] = useState(null)
  
  // Estados de filtros
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // ✅ Função para mostrar feedback
  const showFeedback = (type, message, description = null) => {
    setFeedback({ id: Date.now(), type, message, description })
    // Auto-hide após 5 segundos para success/info, mantém error/warning
    if (type === 'success' || type === 'info') {
      setTimeout(() => setFeedback(null), 5000)
    }
  }

  // ✅ Função para esconder feedback
  const hideFeedback = () => setFeedback(null)

  const { data: allTasks = [], isLoading, refetch } = useTasksQuery({
    type: activeTab === 'team' ? 'team' : (activeTab === 'personal' ? 'personal' : null),
    status: filterStatus !== 'all' ? filterStatus : null,
    limit: 100
  })

  // ✅ Memoizar o fetchTasks
  const fetchTasks = useCallback(async () => {
    if (!profile?.id) return
    
    setLoading(true)
    
    try {
      const { data, error } = await supabase.rpc('fetch_tasks', {
        p_type: activeTab === 'team' ? 'team' : (activeTab === 'personal' ? 'personal' : null),
        p_status: filterStatus !== 'all' ? filterStatus : null,
        p_priority: filterPriority !== 'all' ? filterPriority : null,
        p_search: searchTerm || null
      })
      
      if (error) throw error
      
      setTasks(data || [])
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error)
      showFeedback('error', 'Erro ao carregar tarefas', error.message)
    } finally {
      setLoading(false)
    }
  }, [profile?.id, activeTab, filterStatus, filterPriority, searchTerm])

  const filteredTasks = useMemo(() => {
    let result = allTasks
    
    if (activeTab === 'personal') {
      result = result.filter(t => t.created_by === profile?.id)
    } else if (activeTab === 'my') {
      result = result.filter(t => 
        t.assigned_to?.includes(profile?.id) || t.created_by === profile?.id
      )
    }
    
    if (filterPriority !== 'all') {
      result = result.filter(t => t.priority === filterPriority)
    }
    
    if (searchTerm) {
      result = result.filter(t => 
        t.title?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return result
  }, [allTasks, activeTab, filterPriority, searchTerm, profile?.id])

  // ✅ useEffect com dependências corretas
  useEffect(() => {
    fetchTasks()
    
    // Polling a cada 30 segundos
    const interval = setInterval(fetchTasks, 30000)
    return () => clearInterval(interval)
  }, [fetchTasks])

  // ✅ Criar tarefa
  const handleCreateTask = async (formData) => {
    setIsSubmitting(true)
    
    try {
      const { data, error } = await supabase.rpc('create_task_final', {
        p_title: formData.title,
        p_description: formData.description || null,
        p_type: activeTab === 'team' ? 'team' : 'personal',
        p_priority: formData.priority,
        p_assigned_to: formData.assigned_to || null,
        p_assigned_to_names: formData.assigned_to_names || null,
        p_due_date: formData.due_date || null,
        p_category: formData.category || 'geral'
      })
      
      if (error) throw error
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar tarefa')
      }
      
      showFeedback('success', '✅ Tarefa criada com sucesso!')
      setShowTaskModal(false)
      setEditingTask(null)
      fetchTasks()
    } catch (error) {
      console.error('Erro ao criar tarefa:', error)
      showFeedback('error', 'Erro ao criar tarefa', error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ✅ Atualizar tarefa
  const handleUpdateTask = async (taskId, updates) => {
    try {
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
      
      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao atualizar tarefa')
      }
      
      fetchTasks()
      return true
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error)
      showFeedback('error', 'Erro ao atualizar tarefa', error.message)
      return false
    }
  }

  const handleShowHistory = (task) => {
    setHistoryTask(task)
    setShowHistoryModal(true)
  }

  // ✅ Completar/Descompletar tarefa
  const handleCompleteTask = async (task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed'
    const success = await handleUpdateTask(task.id, {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date() : null,
      completed_by: newStatus === 'completed' ? profile?.id : null
    })
    
    if (success) {
      showFeedback(
        'success', 
        newStatus === 'completed' ? '✅ Tarefa concluída!' : '↩️ Tarefa reaberta!'
      )
    }
  }

  // ✅ Pegar/Assumir tarefa
  const handleClaimTask = async (task) => {
    const currentAssigned = task.assigned_to || []
    const currentNames = task.assigned_to_names || []
    
    // Verificar se já está atribuída ao usuário
    if (currentAssigned.includes(profile?.id)) {
      showFeedback('info', 'Você já é responsável por esta tarefa')
      return
    }
    
    const success = await handleUpdateTask(task.id, {
      assigned_to: [...currentAssigned, profile?.id],
      assigned_to_names: [...currentNames, profile?.full_name || profile?.email]
    })
    
    if (success) {
      showFeedback('success', '✅ Você assumiu esta tarefa!')
    }
  }

  // ✅ Abrir modal de confirmação para deletar
  const handleDeleteClick = (task) => {
    setConfirmModal({
      isOpen: true,
      taskId: task.id,
      taskTitle: task.title
    })
  }

  // ✅ Confirmar exclusão
  const handleConfirmDelete = async () => {
    const { taskId, taskTitle } = confirmModal
    
    try {
      const { data, error } = await supabase.rpc('delete_task', {
        p_task_id: taskId
      })
      
      if (error) throw error
      
      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao excluir tarefa')
      }
      
      showFeedback('success', `✅ Tarefa "${taskTitle}" excluída!`)
      setConfirmModal({ isOpen: false, taskId: null, taskTitle: '' })
      fetchTasks()
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error)
      showFeedback('error', 'Erro ao excluir tarefa', error.message)
      setConfirmModal({ isOpen: false, taskId: null, taskTitle: '' })
    }
  }

  // ✅ Cancelar exclusão
  const handleCancelDelete = () => {
    setConfirmModal({ isOpen: false, taskId: null, taskTitle: '' })
  }

  // ✅ Abrir modal para editar
  const handleEditClick = (task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  // ✅ Salvar edição
  const handleSaveEdit = async (formData) => {
    const success = await handleUpdateTask(editingTask.id, formData)
    
    if (success) {
      showFeedback('success', '✅ Tarefa atualizada com sucesso!')
      setShowTaskModal(false)
      setEditingTask(null)
    }
  }

  // ✅ Configuração de filtros memoizada
  const filterConfig = useMemo(() => [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'Todos' },
        { value: 'pending', label: 'Pendentes' },
        { value: 'in_progress', label: 'Em andamento' },
        { value: 'completed', label: 'Concluídas' }
      ]
    },
    {
      key: 'priority',
      label: 'Prioridade',
      type: 'select',
      defaultValue: 'all',
      options: [
        { value: 'all', label: 'Todas' },
        { value: 'low', label: '🟢 Baixa' },
        { value: 'medium', label: '🔵 Média' },
        { value: 'high', label: '🟠 Alta' },
        { value: 'urgent', label: '🔴 Urgente' }
      ]
    }
  ], [])

  // ✅ Handler para mudança de filtros
  const handleFilterChange = useCallback((newFilters) => {
    if (newFilters.status !== undefined) setFilterStatus(newFilters.status)
    if (newFilters.priority !== undefined) setFilterPriority(newFilters.priority)
  }, [])

  const tabs = [
    { id: 'team', label: 'Equipe', icon: Users, description: 'Tarefas da equipe' },
    { id: 'personal', label: 'Pessoais', icon: User, description: 'Suas tarefas pessoais' },
    { id: 'my', label: 'Minhas', icon: CheckCircle, description: 'Tarefas atribuídas a você' }
  ]

  const currentTab = tabs.find(t => t.id === activeTab)

  const headerActions = [
    {
      label: 'Nova Tarefa',
      icon: Plus,
      onClick: () => {
        setEditingTask(null)
        setShowTaskModal(true)
      },
      variant: 'primary'
    },
    {
      label: 'Atualizar',
      icon: RefreshCw,
      onClick: fetchTasks,
      variant: 'outline',
      loading: loading
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Feedback Message */}
        {feedback && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              description={feedback.description}
              onClose={hideFeedback}
              closable
              animate
            />
          </div>
        )}
        
        <PageHeader
          title="Tarefas"
          description={currentTab?.description || 'Gerencie suas tarefas e da equipe'}
          icon={ClipboardList}
          actions={headerActions}
          extraContent={
            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              {tabs.map(tab => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5 ${
                      activeTab === tab.id
                        ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title={tab.description}
                  >
                    <Icon size={14} />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          }
        />
        
        <DataFilters
          searchPlaceholder="Buscar tarefas por título..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filterConfig}
          onFilterChange={handleFilterChange}
          variant="minimal"
          size="sm"
        />
        
        <div className="mt-4 sm:mt-6">
          {loading ? (
            <DataLoadingSkeleton type="cards" rows={3} cardsPerRow={1} />
          ) : tasks.length === 0 ? (
            <DataEmptyState
              title="Nenhuma tarefa encontrada"
              description={
                searchTerm || filterStatus !== 'all' || filterPriority !== 'all'
                  ? "Nenhuma tarefa corresponde aos filtros aplicados"
                  : "Clique em 'Nova Tarefa' para começar a organizar seu trabalho"
              }
              icon="tasks"
              action={
                (searchTerm || filterStatus !== 'all' || filterPriority !== 'all') ? {
                  label: 'Limpar filtros',
                  onClick: () => {
                    setFilterStatus('all')
                    setFilterPriority('all')
                    setSearchTerm('')
                  }
                } : {
                  label: 'Criar Tarefa',
                  onClick: () => {
                    setEditingTask(null)
                    setShowTaskModal(true)
                  }
                }
              }
            />
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  currentUserId={profile?.id}
                  userRole={profile?.role}
                  onComplete={() => handleCompleteTask(task)}
                  onDelete={() => handleDeleteClick(task)}
                  onEdit={() => handleEditClick(task)}
                  onClaim={() => handleClaimTask(task)}
                  onHistory={handleShowHistory}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de Criação/Edição */}
      <TaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false)
          setEditingTask(null)
        }}
        task={editingTask}
        onSave={editingTask ? handleSaveEdit : handleCreateTask}
        activeTab={activeTab}
        isSubmitting={isSubmitting}
      />

      <TaskHistoryModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false)
          setHistoryTask(null)
        }}
        task={historyTask}
      />
      
      {/* Modal de Confirmação para Exclusão */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Excluir Tarefa"
        message={
          <div className="space-y-2">
            <p className="text-gray-700 dark:text-gray-300">
              Tem certeza que deseja excluir a tarefa:
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              "{confirmModal.taskTitle}"
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta ação não pode ser desfeita.
            </p>
          </div>
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  )
}

export default TaskBoard