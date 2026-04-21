import React, { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormInput from '../forms/FormInput'
import TaskAssigneeSelector from './TaskAssigneeSelector'

const TaskModal = ({ 
  isOpen, 
  onClose, 
  task, 
  onSave, 
  activeTab,
  isSubmitting = false
}) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'team',
    priority: 'medium',
    assigned_to: [],
    assigned_to_names: [],
    due_date: '',
    category: 'geral',
    visibility: 'assigned'
  })
  
  useEffect(() => {
    if (task) {
      setForm({
        ...task,
        assigned_to: task.assigned_to || [],
        assigned_to_names: task.assigned_to_names || []
      })
    } else {
      setForm(prev => ({
        ...prev,
        type: activeTab === 'team' ? 'team' : 'personal'
      }))
    }
  }, [task, activeTab, isOpen])
  
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    onSave(form)
  }
  
  const isEditing = !!task
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={!isSubmitting ? onClose : undefined}
      title={isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Título"
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder="O que precisa ser feito?"
          required
          autoFocus
          disabled={isSubmitting}
        />
        
        <FormInput
          label="Descrição"
          type="textarea"
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Detalhes da tarefa (opcional)"
          rows={3}
          disabled={isSubmitting}
        />
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Prioridade
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm(prev => ({ ...prev, priority: e.target.value }))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="low">🟢 Baixa</option>
              <option value="medium">🔵 Média</option>
              <option value="high">🟠 Alta</option>
              <option value="urgent">🔴 Urgente</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Prazo
            </label>
            <FormInput
              type="date"
              value={form.due_date}
              onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
              disabled={isSubmitting}
            />
          </div>
        </div>
        
        {activeTab === 'team' && (
          <TaskAssigneeSelector
            value={form.assigned_to}
            names={form.assigned_to_names}
            onChange={(ids, names) => setForm(prev => ({ 
              ...prev, 
              assigned_to: ids,
              assigned_to_names: names
            }))}
            disabled={isSubmitting}
          />
        )}
        
        {activeTab === 'personal' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Visibilidade
            </label>
            <select
              value={form.visibility}
              onChange={(e) => setForm(prev => ({ ...prev, visibility: e.target.value }))}
              disabled={isSubmitting}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg"
            >
              <option value="assigned">🔒 Apenas eu</option>
              <option value="team">👥 Equipe pode ver</option>
              <option value="all">🌍 Todos podem ver</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Equipe poderá ver mas não editar
            </p>
          </div>
        )}
        
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 pt-4 mt-2 border-t border-gray-200 dark:border-gray-700">
          <Button 
            type="button"
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
            fullWidth
            className="sm:w-auto"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="primary" 
            loading={isSubmitting}
            fullWidth
            className="sm:w-auto"
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Tarefa'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default TaskModal