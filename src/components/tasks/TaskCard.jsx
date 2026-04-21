import React, { useState } from 'react'
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  User, 
  Users, 
  Calendar, 
  Edit3, 
  Trash2, 
  History,
  MoreVertical,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from '../../lib/icons'
import { formatDate, formatRelativeTime } from '../../utils/formatters'

const priorityConfig = {
  low: { 
    color: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-200 dark:border-gray-700',
    icon: '🟢',
    label: 'Baixa',
    weight: 1
  },
  medium: { 
    color: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    icon: '🔵',
    label: 'Média',
    weight: 2
  },
  high: { 
    color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800',
    icon: '🟠',
    label: 'Alta',
    weight: 3
  },
  urgent: { 
    color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    icon: '🔴',
    label: 'Urgente',
    weight: 4
  }
}

const statusConfig = {
  pending: { 
    icon: Circle, 
    color: 'text-yellow-500', 
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    label: 'Pendente'
  },
  in_progress: { 
    icon: Clock, 
    color: 'text-blue-500', 
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'Em andamento'
  },
  completed: { 
    icon: CheckCircle, 
    color: 'text-green-500', 
    bg: 'bg-green-50 dark:bg-green-900/20',
    label: 'Concluída'
  },
  cancelled: { 
    icon: AlertCircle, 
    color: 'text-gray-500', 
    bg: 'bg-gray-50 dark:bg-gray-800',
    label: 'Cancelada'
  }
}

const TaskCard = ({ 
  task, 
  currentUserId, 
  userRole,
  onComplete, 
  onDelete, 
  onEdit,
  onClaim,
  onHistory,
  compact = false
}) => {
  const [expanded, setExpanded] = useState(false)
  const [showActions, setShowActions] = useState(false)
  
  const isCompleted = task.status === 'completed'
  const isAssignedToMe = Array.isArray(task.assigned_to) 
    ? task.assigned_to.includes(currentUserId)
    : task.assigned_to === currentUserId
    
  const isUnassigned = !task.assigned_to || (Array.isArray(task.assigned_to) && task.assigned_to.length === 0)
  const isCreator = task.created_by === currentUserId
  const isAdmin = userRole === 'admin' || userRole === 'gerente'
  
  const canEdit = isCreator || isAdmin
  const canDelete = isCreator || isAdmin
  const canComplete = isAssignedToMe || task.type === 'personal' || isAdmin
  const canClaim = task.type === 'team' && isUnassigned && !isCompleted
  
  const priority = priorityConfig[task.priority] || priorityConfig.medium
  const status = statusConfig[task.status] || statusConfig.pending
  const StatusIcon = status.icon
  
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted
  
  const assignedCount = Array.isArray(task.assigned_to) ? task.assigned_to.length : (task.assigned_to ? 1 : 0)
  const assignedNames = Array.isArray(task.assigned_to_names) 
    ? task.assigned_to_names 
    : (task.assigned_to_name ? [task.assigned_to_name] : [])
  
  return (
    <div 
      className={`
        group relative bg-white dark:bg-gray-900 rounded-xl border transition-all duration-200
        ${isCompleted 
          ? 'border-gray-200 dark:border-gray-700 opacity-75' 
          : `${priority.border} hover:shadow-lg hover:-translate-y-0.5`
        }
        ${isOverdue && !isCompleted ? 'border-l-4 border-l-red-500 dark:border-l-red-400' : ''}
        ${compact ? 'p-3' : 'p-3 sm:p-4'}
      `}
    >
      <div className="flex items-start gap-2 sm:gap-3">
        {/* Status Indicator - Clickable */}
        <button
          onClick={canComplete ? onComplete : undefined}
          disabled={!canComplete}
          className={`
            mt-0.5 flex-shrink-0 p-1 -m-1 rounded-full transition-all duration-200
            ${canComplete ? 'hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer' : 'cursor-not-allowed opacity-50'}
          `}
          aria-label={isCompleted ? "Marcar como pendente" : "Marcar como concluída"}
          title={canComplete ? (isCompleted ? 'Reabrir tarefa' : 'Concluir tarefa') : 'Sem permissão'}
        >
          <StatusIcon 
            size={compact ? 18 : 20} 
            className={`
              ${status.color}
              ${!isCompleted && canComplete ? 'hover:scale-110' : ''}
              transition-transform
            `} 
          />
        </button>
        
        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0">
          {/* Header: Título + Badges + Ações */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
            <div className="flex-1 min-w-0">
              {/* Título */}
              <h3 className={`
                font-medium break-words
                ${compact ? 'text-sm' : 'text-sm sm:text-base'}
                ${isCompleted ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}
              `}>
                {task.title}
              </h3>
              
              {/* Badges Mobile */}
              <div className="flex flex-wrap items-center gap-1.5 mt-1 sm:hidden">
                <PriorityBadge priority={task.priority} compact />
                {task.type === 'team' && <TeamBadge />}
                {isAssignedToMe && <AssignedBadge />}
              </div>
            </div>
            
            {/* Badges Desktop + Ações */}
            <div className="flex items-center gap-1.5 self-end sm:self-start flex-shrink-0">
              {/* Badges Desktop */}
              <div className="hidden sm:flex items-center gap-1.5">
                <PriorityBadge priority={task.priority} />
                {task.type === 'team' && <TeamBadge />}
                {isAssignedToMe && <AssignedBadge />}
              </div>
              
              {/* Botão de Histórico */}
              <ActionButton
                onClick={() => onHistory?.(task)}
                icon={History}
                label="Histórico"
                color="purple"
              />
              
              {/* Menu de Ações (Mobile: Dropdown / Desktop: Ícones) */}
              {canEdit && !isCompleted && (
                <>
                  <div className="hidden sm:flex items-center">
                    <ActionButton
                      onClick={onEdit}
                      icon={Edit3}
                      label="Editar"
                      color="blue"
                    />
                    <ActionButton
                      onClick={onDelete}
                      icon={Trash2}
                      label="Excluir"
                      color="red"
                    />
                  </div>
                  
                  {/* Mobile Actions Menu */}
                  <div className="relative sm:hidden">
                    <button
                      onClick={() => setShowActions(!showActions)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <MoreVertical size={14} />
                    </button>
                    
                    {showActions && (
                      <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 min-w-32">
                        <MenuItem onClick={onEdit} icon={Edit3} label="Editar" />
                        <MenuItem onClick={onDelete} icon={Trash2} label="Excluir" danger />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Descrição (Expansível) */}
          {task.description && (
            <div className="mt-1.5">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
              >
                {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expanded ? 'Ocultar' : 'Ver descrição'}
              </button>
              
              {expanded && (
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1.5 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {task.description}
                </p>
              )}
            </div>
          )}
          
          {/* Metadados */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {/* Responsáveis */}
            {!isUnassigned && assignedCount > 0 && (
              <div className="flex items-center gap-1" title={assignedNames.join(', ')}>
                <User size={12} className="flex-shrink-0" />
                <span className="truncate max-w-[120px] sm:max-w-none">
                  {assignedCount === 1 ? assignedNames[0] : `${assignedCount} pessoas`}
                </span>
              </div>
            )}
            
            {isUnassigned && task.type === 'team' && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Users size={12} />
                <span>Disponível para equipe</span>
              </span>
            )}
            
            {/* Prazo */}
            {task.due_date && (
              <span className={`
                flex items-center gap-1
                ${isOverdue ? 'text-red-500 dark:text-red-400 font-medium' : ''}
              `}>
                <Calendar size={12} />
                <span>{formatDate(task.due_date)}</span>
                {isOverdue && <span className="hidden sm:inline ml-0.5">(Atrasada)</span>}
              </span>
            )}
            
            {/* Criado em */}
            <span className="flex items-center gap-1" title={formatDate(task.created_at)}>
              <Clock size={12} />
              <span>{formatRelativeTime(task.created_at)}</span>
            </span>
            
            {/* Criado por (apenas admin/gerente) */}
            {isAdmin && task.created_by_name && !isCreator && (
              <span className="flex items-center gap-1 text-gray-400">
                <User size={12} />
                <span>por {task.created_by_name}</span>
              </span>
            )}
          </div>
          
          {/* Botão "Pegar tarefa" */}
          {canClaim && onClaim && (
            <button
              onClick={onClaim}
              className="mt-2 sm:mt-3 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm hover:shadow"
            >
              <User size={12} />
              Assumir tarefa
            </button>
          )}
          
          {/* Status de conclusão */}
          {isCompleted && task.completed_at && (
            <div className="mt-2 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle size={12} />
              <span>
                Concluída {formatRelativeTime(task.completed_at)}
                {task.completed_by_name && ` por ${task.completed_by_name}`}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress Bar para tarefas com subtasks (opcional futuro) */}
      {task.progress !== undefined && (
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${task.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {task.progress}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Subcomponentes
const PriorityBadge = ({ priority, compact = false }) => {
  const config = priorityConfig[priority] || priorityConfig.medium
  
  return (
    <span className={`
      text-xs px-2 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap font-medium
      ${config.color}
    `}>
      <span>{config.icon}</span>
      {!compact && <span className="hidden sm:inline">{config.label}</span>}
    </span>
  )
}

const TeamBadge = () => (
  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center gap-1">
    <Users size={10} />
    <span className="hidden sm:inline">Equipe</span>
  </span>
)

const AssignedBadge = () => (
  <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center gap-1">
    <User size={10} />
    <span className="hidden sm:inline">Atribuída</span>
  </span>
)

const ActionButton = ({ onClick, icon: Icon, label, color = 'gray' }) => {
  const colors = {
    gray: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
    blue: 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400',
    red: 'text-gray-400 hover:text-red-600 dark:hover:text-red-400',
    purple: 'text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
  }
  
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${colors[color]}`}
      title={label}
      aria-label={label}
    >
      <Icon size={14} />
    </button>
  )
}

const MenuItem = ({ onClick, icon: Icon, label, danger = false }) => (
  <button
    onClick={onClick}
    className={`
      w-full px-3 py-2 text-xs flex items-center gap-2 transition-colors
      ${danger 
        ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30' 
        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      }
    `}
  >
    <Icon size={12} />
    {label}
  </button>
)

export default TaskCard