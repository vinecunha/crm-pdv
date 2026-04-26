// src/pages/Settings.jsx
import React, { useState } from 'react'
import { Shield, Settings as SettingsIcon } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import { useUI } from '@contexts/UIContext'
import { useSettingsQueries } from '@hooks/queries/useSettingsQueries'
import { useSettingsMutations } from '@hooks/mutations/useSettingsMutations'
import { useSettingsHandlers } from '@hooks/handlers/useSettingsHandlers'
import SplashScreen from '@components/ui/SplashScreen'
import PageHeader from '@components/ui/PageHeader'
import SettingsSidebar from '@components/settings/SettingsSidebar'
import CompanySettingsTab from '@components/settings/CompanySettingsTab'
import AppearanceSettingsTab from '@components/settings/AppearanceSettingsTab'
import PermissionsSettingsTab from '@components/settings/PermissionsSettingsTab'
import SecuritySettingsTab from '@components/settings/SecuritySettingsTab'

const Settings = () => {
  const { isAdmin, changePassword, logout } = useAuth()
  const { showFeedback } = useUI()
  
  const [activeTab, setActiveTab] = useState('company')
  const [localSettings, setLocalSettings] = useState(null)

  // ✅ Queries centralizadas
  const { 
    companySettings,
    isLoading,
    error,
    refetch
  } = useSettingsQueries(isAdmin)

  // ✅ Mutations - definido antes dos handlers
  const { saveMutation } = useSettingsMutations({
    onSettingsSaved: () => {
      setLocalSettings(null)
      showFeedback('Configurações salvas com sucesso!')
    },
    onError: (error) => {
      showFeedback('Erro ao salvar: ' + error.message, 'error')
    }
  })

  // ✅ Handlers - agora mutations existe
  const handlers = useSettingsHandlers({
    companySettings,
    localSettings,
    setLocalSettings,
    setActiveTab,
    showFeedback,
    logout,
    refetch,
    changePassword,
    saveMutation
  })

  const currentSettings = localSettings || companySettings || {}

  // Acesso restrito
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4 inline-block mb-4">
            <Shield className="h-10 w-10 sm:h-12 sm:w-12 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">Acesso Restrito</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Apenas administradores podem acessar as configurações.
          </p>
        </div>
      </div>
    )
  }

  // Carregando
  if (isLoading) {
    return <SplashScreen fullScreen message="Carregando configurações..." />
  }
  
  // Erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Erro ao carregar configurações
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
            {error.message}
          </p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-sm transition-colors"
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
        <PageHeader
          title="Configurações"
          description="Gerencie as preferências do sistema"
          icon={SettingsIcon}
        />

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          <div className="lg:w-64 flex-shrink-0">
            <SettingsSidebar 
              activeTab={activeTab} 
              setActiveTab={handlers.handleTabChange} 
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {activeTab === 'company' && (
                <CompanySettingsTab 
                  settings={currentSettings} 
                  setSettings={handlers.handleSettingsChange} 
                  onSave={handlers.handleSave} 
                  saving={saveMutation.isPending} 
                />
              )}
              
              {activeTab === 'appearance' && (
                <AppearanceSettingsTab 
                  settings={currentSettings} 
                  setSettings={handlers.handleSettingsChange} 
                  onSave={handlers.handleSave} 
                  saving={saveMutation.isPending} 
                />
              )}
              
              {activeTab === 'permissions' && (
                <PermissionsSettingsTab />
              )}
              
              {activeTab === 'security' && (
                <SecuritySettingsTab 
                  onChangePassword={handlers.handleChangePassword} 
                  onLogout={handlers.handleLogout} 
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