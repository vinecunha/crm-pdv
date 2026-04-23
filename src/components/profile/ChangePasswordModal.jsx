import React, { useState } from 'react'
import { Eye, EyeOff } from '@lib/icons'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import PasswordStrengthIndicator from '@components/ui/PasswordStrengthIndicator'
import { usePasswordStrength } from '@contexts/AuthContext.jsx'

const ChangePasswordModal = ({ isOpen, onClose, onChangePassword }) => {
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const passwordStrength = usePasswordStrength(form.newPassword)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!form.currentPassword) {
      setError('Senha atual é obrigatória')
      return
    }
    if (!passwordStrength.valid) {
      setError(passwordStrength.message)
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)
    try {
      await onChangePassword(form.currentPassword, form.newPassword)
      onClose()
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const PasswordInput = ({ label, name, value, onChange, show, onToggle }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 pr-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Alterar Senha" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <PasswordInput
          label="Senha Atual"
          value={form.currentPassword}
          onChange={(v) => setForm({ ...form, currentPassword: v })}
          show={showPasswords.current}
          onToggle={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
        />

        <div>
          <PasswordInput
            label="Nova Senha"
            value={form.newPassword}
            onChange={(v) => setForm({ ...form, newPassword: v })}
            show={showPasswords.new}
            onToggle={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
          />
          <PasswordStrengthIndicator password={form.newPassword} />
        </div>

        <PasswordInput
          label="Confirmar Nova Senha"
          value={form.confirmPassword}
          onChange={(v) => setForm({ ...form, confirmPassword: v })}
          show={showPasswords.confirm}
          onToggle={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" loading={loading}>
            Alterar Senha
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default ChangePasswordModal
