import React from 'react'
import { Mail, User, Lock, Shield } from 'lucide-react'
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder="usuario@exemplo.com"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            placeholder="Nome do usuário"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            autoComplete="off"
          />
        </div>
      </div>

      {!editingUser && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              placeholder="Mínimo 6 caracteres"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              autoComplete="new-password"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">A senha deve ter no mínimo 6 caracteres</p>
        </div>
      )}

      {canChangeRole && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          >
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {roles.find(r => r.value === formData.role)?.description}
          </p>
        </div>
      )}

      {editingUser && !canChangeRole && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Papel</label>
          <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm">
            {formData.role === 'admin' ? 'Administrador' : formData.role === 'gerente' ? 'Gerente' : 'Operador'}
          </div>
          <p className="text-xs text-gray-500 mt-1">Para alterar o papel, contate um administrador</p>
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