// src/components/commissions/RuleModal.jsx
import React, { useState, useEffect } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import FormInput from '../forms/FormInput'
import { Save } from '../../lib/icons'

const RuleModal = ({ isOpen, onClose, rule, onSave, isSaving }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    percentage: 2.0,
    min_sales: 0,
    max_sales: '',
    priority: 10,
    is_active: true,
    rule_type: 'percentage'
  })
  
  useEffect(() => {
    if (rule) {
      setForm({
        name: rule.name || '',
        description: rule.description || '',
        percentage: rule.percentage || 2.0,
        min_sales: rule.min_sales || 0,
        max_sales: rule.max_sales || '',
        priority: rule.priority || 10,
        is_active: rule.is_active ?? true,
        rule_type: rule.rule_type || 'percentage'
      })
    } else {
      setForm({
        name: '',
        description: '',
        percentage: 2.0,
        min_sales: 0,
        max_sales: '',
        priority: 10,
        is_active: true,
        rule_type: 'percentage'
      })
    }
  }, [rule, isOpen])
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const dataToSave = {
      ...form,
      id: rule?.id,
      max_sales: form.max_sales === '' ? null : parseFloat(form.max_sales)
    }
    
    await onSave(dataToSave)
  }
  
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rule ? 'Editar Regra de Comissão' : 'Nova Regra de Comissão'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Nome da Regra"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Ex: Comissão Padrão"
          required
          autoFocus
        />
        
        <FormInput
          label="Descrição"
          type="textarea"
          value={form.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Descreva quando esta regra se aplica"
          rows={2}
        />
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Percentual (%)"
            type="number"
            value={form.percentage}
            onChange={(e) => handleChange('percentage', parseFloat(e.target.value) || 0)}
            min={0}
            max={100}
            step={0.5}
            required
            helperText="Percentual sobre o valor da venda"
          />
          
          <FormInput
            label="Prioridade"
            type="number"
            value={form.priority}
            onChange={(e) => handleChange('priority', parseInt(e.target.value) || 1)}
            min={1}
            max={100}
            helperText="Menor número = maior prioridade"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Venda Mínima (R$)"
            type="number"
            value={form.min_sales}
            onChange={(e) => handleChange('min_sales', parseFloat(e.target.value) || 0)}
            min={0}
            step={100}
            helperText="Valor mínimo para aplicar a regra"
          />
          
          <FormInput
            label="Venda Máxima (R$)"
            type="number"
            value={form.max_sales}
            onChange={(e) => handleChange('max_sales', e.target.value)}
            min={0}
            step={100}
            helperText="Opcional - deixe vazio para sem limite"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Regra
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={form.rule_type === 'percentage'}
                onChange={() => handleChange('rule_type', 'percentage')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Percentual</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={form.rule_type === 'fixed'}
                onChange={() => handleChange('rule_type', 'fixed')}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Valor Fixo</span>
            </label>
          </div>
        </div>
        
        <label className="flex items-center gap-2 cursor-pointer pt-2">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => handleChange('is_active', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Regra ativa
          </span>
        </label>
        
        {/* Preview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Para uma venda de <strong>R$ 500,00</strong>, a comissão será de{' '}
            <strong className="text-green-600 dark:text-green-400">
              {form.rule_type === 'percentage' 
                ? `${form.percentage}% (R$ ${(500 * form.percentage / 100).toFixed(2)})`
                : `R$ ${form.percentage.toFixed(2)}`
              }
            </strong>
          </p>
        </div>
        
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={isSaving} icon={Save}>
            {rule ? 'Salvar Alterações' : 'Criar Regra'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default RuleModal