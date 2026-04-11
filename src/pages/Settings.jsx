import React, { useState, useEffect } from 'react'
import { Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import SplashScreen from '../components/ui/SplashScreen'

import SettingsSidebar from '../components/settings/SettingsSidebar'
import CompanySettingsTab from '../components/settings/CompanySettingsTab'
import AppearanceSettingsTab from '../components/settings/AppearanceSettingsTab'
import PermissionsSettingsTab from '../components/settings/PermissionsSettingsTab'
import SecuritySettingsTab from '../components/settings/SecuritySettingsTab'

const Settings = () => {
  const { profile, isAdmin, changePassword, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('company')
  const [feedback, setFeedback] = useState({ message: null, type: 'success' })

  const [companySettings, setCompanySettings] = useState({
    company_name: '', company_logo_url: '/brasalino-pollo.png', domain: '',
    email: '', phone: '', address: '', city: '', state: '', zip_code: '', cnpj: '',
    primary_color: '#2563eb', secondary_color: '#7c3aed'
  })

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const { data } = await supabase.from('company_settings').select('*').limit(1).single()
      if (data) setCompanySettings(prev => ({ ...prev, ...data }))
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback({ message: null, type: 'success' }), 3000)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('company_settings').upsert({ ...companySettings, updated_at: new Date().toISOString() })
      if (error) throw error
      showFeedback('Configurações salvas!')
    } catch (error) {
      showFeedback('Erro ao salvar: ' + error.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (current, newPassword) => {
    await changePassword(newPassword)
    showFeedback('Senha alterada com sucesso!')
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full p-4 inline-block mb-4"><Shield className="h-12 w-12 text-red-600" /></div>
          <h2 className="text-2xl font-bold text-red-600">Acesso Restrito</h2>
          <p className="mt-2 text-gray-600">Apenas administradores podem acessar as configurações.</p>
        </div>
      </div>
    )
  }

  if (loading) return <SplashScreen fullScreen message="Carregando configurações..." />

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500 mt-1">Gerencie as preferências do sistema</p>
        </div>

        {feedback.message && <FeedbackMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ message: null })} />}

        <div className="flex flex-col lg:flex-row gap-6">
          <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {activeTab === 'company' && <CompanySettingsTab settings={companySettings} setSettings={setCompanySettings} onSave={handleSave} saving={saving} />}
              {activeTab === 'appearance' && <AppearanceSettingsTab settings={companySettings} setSettings={setCompanySettings} onSave={handleSave} saving={saving} />}
              {activeTab === 'permissions' && <PermissionsSettingsTab />}
              {activeTab === 'security' && <SecuritySettingsTab onChangePassword={handleChangePassword} onLogout={logout} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings