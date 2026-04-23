import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  Circle, 
  Clock, 
  AlertCircle, 
  User, 
  Users,
  CheckCircle,
  Calendar,
  ChevronRight
} from '@lib/icons'
import { formatDate, formatRelativeTime } from '@utils/formatters'

const TaskWidget = ({ 
  myTasks = [], 
  teamTasks = [], 
  maxItems = 3,
  loading = false,
  defaultTab = 'my'
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab)
  
  // Filtrar apenas tarefas pendentes/não concluídas
  const pendingMyTasks = useMemo(() => 
    myTasks.filter(t => t.status !== 'completed'), 
  [myTasks])
  
  const pendingTeamTasks = useMemo(() => 
    teamTasks.filter(t => t.status !== 'completed'), 
  [teamTasks])
  
  const currentTasks = activeTab === 'my' ? pendingMyTasks : pendingTeamTasks
  const displayTasks = currentTasks.slice(0, maxItems)
  const remainingCount = Math.max(0, currentTasks.length - maxItems)
  
  const tabs = [
    { 
      id: 'my', 
      label: 'Minhas', 
      icon: User, 
      count: pendingMyTasks.length,
      color: 'blue'
    },
    { 
      id: 'team', 
      label: 'Equipe', 
      icon: Users, 
      count: pendingTeamTasks.length,
      color: 'green'
    }
  ]
  
  const currentTab = tabs.find(t => t.id === activeTab)
  
  // Renderizar estado de carregamento
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
          {tabs.map(tab => (
            <div key={tab.id} className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
        <div className="flex gap-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                  flex items-center gap-1.5
                  ${isActive 
                    ? `text-${tab.color}-600 dark:text-${tab.color}-400 bg-${tab.color}-50 dark:bg-${tab.color}-900/30` 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`
                    ml-0.5 px-1.5 py-0.5 text-xs font-semibold rounded-full
                    ${isActive 
                      ? `bg-${tab.color}-200 dark:bg-${tab.color}-800 text-${tab.color}-700 dark:text-${tab.color}-300`
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        
        <Link 
          to="/tasks" 
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5"
        >
          Ver todas
          <ChevronRight size={14} />
        </Link>
      </div>
      
      {/* Conteúdo */}
      {currentTasks.length === 0 ? (
        <EmptyState tab={activeTab} />
      ) : (
        <div className="space-y-1">
          {displayTasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
          
          {remainingCount > 0 && (
            <Link
              to={`/tasks?tab=${activeTab}`}
              className="block text-center text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              + {remainingCount} {remainingCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

// Subcomponente: Item de Tarefa
const TaskItem = ({ task }) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()
  const priorityColors = {
    urgent: 'text-red-500 border-red-500',
    high: 'text-orange-500 border-orange-500',
    medium: 'text-blue-500 border-blue-500',
    low: 'text-gray-400 border-gray-400'
  }
  
  const priorityColor = priorityColors[task.priority] || priorityColors.medium
  
  return (
    <Link
      to="/tasks"
      className="flex items-start gap-3 p-2.5 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 group"
    >
      {/* Status/Prioridade */}
      <div className={`flex-shrink-0 mt-0.5 ${priorityColor}`}>
        {task.priority === 'urgent' ? (
          <AlertCircle size={16} />
        ) : (
          <Circle size={16} />
        )}
      </div>
      
      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {task.title}
          </p>
          
          {/* Badge de tipo (apenas na aba equipe) */}
          {task.type === 'team' && (
            <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center gap-0.5">
              <Users size={8} />
              Equipe
            </span>
          )}
        </div>
        
        {/* Metadados */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
          {/* Responsável */}
          {task.assigned_to_names?.length > 0 ? (
            <span className="flex items-center gap-0.5">
              <User size={10} />
              <span className="truncate max-w-[100px]">
                {task.assigned_to_names.length === 1 
                  ? task.assigned_to_names[0]
                  : `${task.assigned_to_names.length} pessoas`
                }
              </span>
            </span>
          ) : task.type === 'team' ? (
            <span className="flex items-center gap-0.5 text-green-600 dark:text-green-400">
              <Users size={10} />
              <span>Disponível</span>
            </span>
          ) : null}
          
          {/* Prazo */}
          {task.due_date && (
            <span className={`flex items-center gap-0.5 ${isOverdue ? 'text-red-500 dark:text-red-400 font-medium' : ''}`}>
              <Calendar size={10} />
              <span>{formatDate(task.due_date)}</span>
              {isOverdue && <span className="hidden sm:inline ml-0.5">(Atrasada)</span>}
            </span>
          )}
          
          {/* Status */}
          {task.status === 'in_progress' && (
            <span className="flex items-center gap-0.5 text-blue-500">
              <Clock size={10} />
              <span>Em andamento</span>
            </span>
          )}
          
          {/* Criado há */}
          <span className="flex items-center gap-0.5 text-gray-400">
            <Clock size={10} />
            {formatRelativeTime(task.created_at)}
          </span>
        </div>
      </div>
      
      {/* Seta indicadora */}
      <ChevronRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0 self-center opacity-0 group-hover:opacity-100" />
    </Link>
  )
}

// Subcomponente: Estado Vazio
const EmptyState = ({ tab }) => {
  const messages = {
    my: {
      emoji: '🎯',
      title: 'Nenhuma tarefa pendente!',
      description: 'Você não tem tarefas atribuídas no momento.'
    },
    team: {
      emoji: '🤝',
      title: 'Equipe em dia!',
      description: 'Não há tarefas pendentes para a equipe.'
    }
  }
  
  const { emoji, title, description } = messages[tab]
  
  return (
    <div className="text-center py-6">
      <div className="text-3xl mb-2">{emoji}</div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
        {description}
      </p>
      <Link 
        to="/tasks" 
        className="mt-3 inline-block text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-white dark:hover:text-white bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-600 dark:hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-all duration-200"
      >
        {tab === 'my' ? 'Ver minhas tarefas' : 'Ver tarefas da equipe'}
      </Link>
    </div>
  )
}

export default TaskWidget
