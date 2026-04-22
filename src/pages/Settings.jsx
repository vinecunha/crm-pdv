import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, Settings as SettingsIcon } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { sanitizeObject } from '@utils/sanitize'
import FeedbackMessage from '@components/ui/FeedbackMessage'
import SplashScreen from '@components/ui/SplashScreen'
import PageHeader from '@components/ui/PageHeader'

import SettingsSidebar from '@components/settings/SettingsSidebar'
import CompanySettingsTab from '@components/settings/CompanySettingsTab'
import AppearanceSettingsTab from '@components/settings/AppearanceSettingsTab'
import PermissionsSettingsTab from '@components/settings/PermissionsSettingsTab'
import SecuritySettingsTab from '@components/settings/SecuritySettingsTab'

const fetchCompanySettings = async () => {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .limit(1)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data || {
    company_name: '',
    company_logo_url: '/brasalino-pollo.png',
    domain: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    cnpj: '',
    primary_color: '#2563eb',
    secondary_color: '#7c3aed'
  }
}

const saveCompanySettings = async (settings) => {
  const safeData = sanitizeObject(settings) 
  
  const { error } = await supabase
    .from('company_settings')
    .upsert({ 
      ...safeData, 
      updated_at: new Date().toISOString() 
    })
  
  if (error) throw error
  return safeData
}

const Settings = () => {
  const { profile, isAdmin, changePassword, logout } = useAuth()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('company')
  const [feedback, setFeedback] = useState({ message: null, type: 'success' })
  const [localSettings, setLocalSettings] = useState(null)

  const { 
    data: companySettings,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['company-settings'],
    queryFn: fetchCompanySettings,
    enabled: isAdmin,
    staleTime: 0,
  })

  const saveMutation = useMutation({
    mutationFn: saveCompanySettings,
    onSuccess: (data) => {
      queryClient.setQueryData(['company-settings'], data)
      showFeedback('Configurações salvas com sucesso!')
    },
    onError: (error) => {
      showFeedback('Erro ao salvar: ' + error.message, 'error')
    }
  })

  const showFeedback = (message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback({ message: null, type: 'success' }), 3000)
  }

  const handleSave = () => {
    const settingsToSave = localSettings || companySettings
    saveMutation.mutate(settingsToSave)
  }

  const handleChangePassword = async (current, newPassword) => {
    await changePassword(newPassword)
    showFeedback('Senha alterada com sucesso!')
  }

  const currentSettings = localSettings || companySettings || {}

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 inline-block mb-4">
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">Acesso Restrito</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Apenas administradores podem acessar as configurações.</p>
        </div>
      </div>
    )
  }

  if (isLoading) return <SplashScreen fullScreen message="Carregando configurações..." />
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar configurações</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">{error.message}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-sm"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {feedback.message && (
          <FeedbackMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback({ message: null })} 
          />
        )}

        <PageHeader
          title="Configurações"
          description="Gerencie as preferências do sistema"
          icon={SettingsIcon}
        />

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar - Em coluna no mobile, linha com scroll */}
          <div className="lg:w-64 flex-shrink-0">
            <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {activeTab === 'company' && (
                <CompanySettingsTab 
                  settings={currentSettings} 
                  setSettings={setLocalSettings} 
                  onSave={handleSave} 
                  saving={saveMutation.isPending} 
                />
              )}
              
              {activeTab === 'appearance' && (
                <AppearanceSettingsTab 
                  settings={currentSettings} 
                  setSettings={setLocalSettings} 
                  onSave={handleSave} 
                  saving={saveMutation.isPending} 
                />
              )}
              
              {activeTab === 'permissions' && (
                <PermissionsSettingsTab />
              )}
              
              {activeTab === 'security' && (
                <SecuritySettingsTab 
                  onChangePassword={handleChangePassword} 
                  onLogout={logout} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings