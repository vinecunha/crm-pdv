import React, { useState, useEffect } from 'react'
import { Shield } from '@lib/icons'
import FormInput from '../forms/FormInput'
import Button from '../ui/Button'
import * as userService from '@services/userService'

const UserForm = ({ 
  editingUser, 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  canChangeRole 
}) => {
  const [generatingCode, setGeneratingCode] = useState(false)

  useEffect(() => {
    if (!editingUser && !formData.registration_number) {
      handleGenerateRegistration()
    }
  }, [editingUser])

  const handleGenerateRegistration = async () => {
    setGeneratingCode(true)
    try {
      const registration = await userService.generateRegistrationNumber()
      setFormData(prev => ({ ...prev, registration_number: registration }))
    } catch (error) {
      console.error('Erro ao gerar matrícula:', error)
    } finally {
      setGeneratingCode(false)
    }
  }

  // ✅ Handler compatível com FormInput
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const roles = [
    { value: 'operador', label: 'Operador', description: 'Acesso básico ao sistema' },
    { value: 'gerente', label: 'Gerente', description: 'Gerencia vendas e produtos' },
    { value: 'admin', label: 'Administrador', description: 'Acesso total ao sistema' }
  ]

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Matrícula - Input customizado por causa do botão "Gerar" */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Matrícula
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              name="registration_number"
              value={formData.registration_number || ''}
              onChange={handleChange}
              placeholder="FUNC000001"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white font-mono rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              disabled={!!editingUser || generatingCode}
              readOnly={!editingUser}
            />
          </div>
          {!editingUser && (
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateRegistration}
              loading={generatingCode}
              disabled={generatingCode}
            >
              Gerar
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {editingUser 
            ? 'Matrícula do funcionário (não pode ser alterada)' 
            : 'Matrícula gerada automaticamente'}
        </p>
      </div>

      {/* Email - Usar FormInput */}
      {!editingUser && (
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          placeholder="usuario@exemplo.com"
          autoComplete="off"
        />
      )}

      {/* Nome Completo - Usar FormInput */}
      <FormInput
        label="Nome Completo"
        name="full_name"
        value={formData.full_name || ''}
        onChange={handleChange}
        required
        disabled={isSubmitting}
        placeholder="Nome do usuário"
        autoComplete="off"
      />

      {/* Senha - Usar FormInput com toggle */}
      {!editingUser && (
        <FormInput
          label="Senha"
          name="password"
          type="password"
          value={formData.password || ''}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          showPasswordToggle
          helperText="A senha deve ter no mínimo 6 caracteres"
        />
      )}

      {/* Role - Select customizado */}
      {canChangeRole && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <span className="flex items-center gap-2">
              <Shield size={16} />
              Papel do Usuário
            </span>
          </label>
          <select
            name="role"
            value={formData.role || 'operador'}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {roles.find(r => r.value === formData.role)?.description}
          </p>
        </div>
      )}

      {editingUser && !canChangeRole && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Papel</label>
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white">
            {formData.role === 'admin' ? 'Administrador' : formData.role === 'gerente' ? 'Gerente' : 'Operador'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Para alterar o papel, contate um administrador</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} fullWidth>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" loading={isSubmitting} disabled={isSubmitting} fullWidth>
          {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
        </Button>
      </div>
    </form>
  )
}

export default UserForm