// src/hooks/handlers/useSettingsHandlers.js
import { useCallback } from 'react'

export const useSettingsHandlers = ({
  companySettings,
  localSettings,
  setLocalSettings,
  setActiveTab,
  setFeedback,
  saveMutation,
  changePassword,
  logout
}) => {

  const showFeedback = useCallback((message, type = 'success') => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback({ message: null, type: 'success' }), 3000)
  }, [setFeedback])

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab)
    setLocalSettings(null) // Reset local changes when switching tabs
  }, [setActiveTab, setLocalSettings])

  const handleSettingsChange = useCallback((settings) => {
    setLocalSettings(settings)
  }, [setLocalSettings])

  const handleSave = useCallback(() => {
    const settingsToSave = localSettings || companySettings
    saveMutation.mutate(settingsToSave)
  }, [localSettings, companySettings, saveMutation])

  const handleChangePassword = useCallback(async (current, newPassword) => {
    try {
      await changePassword(newPassword)
      showFeedback('Senha alterada com sucesso!')
      return true
    } catch (error) {
      showFeedback('Erro ao alterar senha: ' + error.message, 'error')
      return false
    }
  }, [changePassword, showFeedback])

  const handleLogout = useCallback(() => {
    logout()
  }, [logout])

  const handleResetLocalChanges = useCallback(() => {
    setLocalSettings(null)
  }, [setLocalSettings])

  return {
    showFeedback,
    handleTabChange,
    handleSettingsChange,
    handleSave,
    handleChangePassword,
    handleLogout,
    handleResetLocalChanges
  }
}