import React, { useState } from 'react'
import { Settings, Save, X } from '../../lib/icons'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormInput from '../forms/FormInput'

const GoalSettings = ({ 
  isOpen, 
  onClose, 
  currentGoals, 
  onSave, 
  isSaving,
  userName 
}) => {
  const [goals, setGoals] = useState({
    daily: currentGoals?.daily?.target_amount || 1000,
    monthly: currentGoals?.monthly?.target_amount || 20000,
    yearly: currentGoals?.yearly?.target_amount || 240000
  })
  
  const handleSave = async () => {
    await onSave(goals)
    onClose()
  }
  
  const handleChange = (type, value) => {
    setGoals(prev => ({
      ...prev,
      [type]: parseFloat(value) || 0
    }))
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurar Metas - ${userName}`}
      size="md"
    >
      <div className="space-y-6">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Defina as metas de vendas para este vendedor. 
          O progresso será calculado automaticamente.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meta Diária (R$)
            </label>
            <FormInput
              type="number"
              value={goals.daily}
              onChange={(e) => handleChange('daily', e.target.value)}
              min={0}
              step={100}
              helperText="Valor esperado de vendas por dia"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meta Mensal (R$)
            </label>
            <FormInput
              type="number"
              value={goals.monthly}
              onChange={(e) => handleChange('monthly', e.target.value)}
              min={0}
              step={1000}
              helperText="Valor esperado de vendas por mês"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meta Anual (R$)
            </label>
            <FormInput
              type="number"
              value={goals.yearly}
              onChange={(e) => handleChange('yearly', e.target.value)}
              min={0}
              step={10000}
              helperText="Valor esperado de vendas por ano"
            />
          </div>
        </div>
        
        {/* Sugestões rápidas */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Sugestões baseadas em padrões:
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setGoals({ daily: 500, monthly: 10000, yearly: 120000 })}
              className="text-xs px-3 py-1 bg-white dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Iniciante
            </button>
            <button
              onClick={() => setGoals({ daily: 1000, monthly: 20000, yearly: 240000 })}
              className="text-xs px-3 py-1 bg-white dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Intermediário
            </button>
            <button
              onClick={() => setGoals({ daily: 2000, monthly: 40000, yearly: 480000 })}
              className="text-xs px-3 py-1 bg-white dark:bg-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Avançado
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose} icon={X}>
          Cancelar
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          loading={isSaving}
          icon={Save}
        >
          Salvar Metas
        </Button>
      </div>
    </Modal>
  )
}

export default GoalSettings