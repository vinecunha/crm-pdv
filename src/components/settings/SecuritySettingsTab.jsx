import React, { useState } from 'react'
import { Key, Shield, AlertCircle, LogOut } from 'lucide-react'
import Button from '../ui/Button'
import { useAuth } from '../../contexts/AuthContext'

const SecuritySettingsTab = ({ onChangePassword, onLogout }) => {
  const { profile } = useAuth()
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (passwordForm.new !== passwordForm.confirm) {
      setError('As senhas não coincidem')
      return
    }
    if (passwordForm.new.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres')
      return
    }

    setLoading(true)
    try {
      await onChangePassword(passwordForm.current, passwordForm.new)
      setShowPasswordForm(false)
      setPasswordForm({ current: '', new: '', confirm: '' })
    } catch (err) {
      setError(err.message || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Segurança da Conta</h2>
      
      <div className="space-y-4">
        {!showPasswordForm ? (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Key size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Alterar Senha</h3>
                  <p className="text-sm text-gray-500">Altere sua senha de acesso ao sistema</p>
                </div>
              </div>
              <Button size="sm" onClick={() => setShowPasswordForm(true)}>Alterar</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2"><AlertCircle size={16} />{error}</div>}
            <input type="password" placeholder="Senha atual" value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            <input type="password" placeholder="Nova senha" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            <input type="password" placeholder="Confirmar nova senha" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => { setShowPasswordForm(false); setError('') }}>Cancelar</Button>
              <Button type="submit" loading={loading}>Salvar</Button>
            </div>
          </form>
        )}

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Sessão Ativa</h3>
                <p className="text-sm text-gray-500">Logado como {profile?.email}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={onLogout} icon={LogOut}>Sair</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SecuritySettingsTab