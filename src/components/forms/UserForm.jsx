import React from 'react'
import { Mail, User, Lock, Shield } from '../../lib/icons'
import FormInput from './FormInput'
import Button from '../ui/Button'

const UserForm = ({ 
  editingUser, 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  canChangeRole 
}) => {
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
      {!editingUser && (
        <FormInput
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          placeholder="usuario@exemplo.com"
          icon={Mail}
          autoComplete="off"
        />
      )}

      <FormInput
        label="Nome Completo"
        name="full_name"
        type="text"
        value={formData.full_name}
        onChange={handleChange}
        required
        disabled={isSubmitting}
        placeholder="Nome do usuário"
        icon={User}
        autoComplete="off"
      />

      {!editingUser && (
        <FormInput
          label="Senha"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          disabled={isSubmitting}
          placeholder="********"
          icon={Lock}
          helperText="Mínimo de 6 caracteres"
          autoComplete="new-password"
        />
      )}

      {canChangeRole && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            <span className="flex items-center gap-2">
              <Shield size={16} />
              Papel do Usuário
            </span>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-800"
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {roles.find(r => r.value === formData.role)?.description}
          </p>
        </div>
      )}

      {editingUser && !canChangeRole && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Papel</label>
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white">
            {formData.role === 'admin' && 'Administrador'}
            {formData.role === 'gerente' && 'Gerente'}
            {formData.role === 'operador' && 'Operador'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Para alterar o papel, contate um administrador
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          fullWidth
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={isSubmitting}
          fullWidth
        >
          {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
        </Button>
      </div>
    </form>
  )
}

export default UserForm