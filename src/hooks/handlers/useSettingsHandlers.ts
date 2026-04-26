import { useCallback } from 'react'
import { useUI } from '@contexts/UIContext'

// Baseado em: public.company_settings
interface CompanySettings {
  id: string
  company_name: string
  company_logo: string | null
  company_logo_url: string | null
  favicon: string | null
  domain: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  cnpj: string | null
  social_media: Record<string, unknown> | null
  primary_color: string | null
  secondary_color: string | null
  custom_css: string | null
  created_at: string | null
  updated_at: string | null
}

interface FeedbackState {
  message: string | null
  type: 'success' | 'error' | 'info' | 'warning'
}

interface MutationResult<T> {
  mutate: (data: T, options?: { onSuccess?: () => void; onError?: (error: Error) => void }) => void
}

interface UseSettingsHandlersProps {
  companySettings: CompanySettings | null
  localSettings: CompanySettings | null
  setLocalSettings: (settings: CompanySettings | null) => void
  setActiveTab: (tab: string) => void
  saveMutation: MutationResult<CompanySettings>
  changePassword: (newPassword: string) => Promise<void>
  logout: () => void
}

interface UseSettingsHandlersReturn {
  showFeedback: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  handleTabChange: (tab: string) => void
  handleSettingsChange: (settings: CompanySettings) => void
  handleSave: () => void
  handleChangePassword: (current: string, newPassword: string) => Promise<boolean>
  handleLogout: () => void
  handleResetLocalChanges: () => void
}

export const useSettingsHandlers = ({
  companySettings,
  localSettings,
  setLocalSettings,
  setActiveTab,
  saveMutation,
  changePassword,
  logout
}: UseSettingsHandlersProps): UseSettingsHandlersReturn => {

  const { showFeedback } = useUI()

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    setLocalSettings(null)
  }, [setActiveTab, setLocalSettings])

  const handleSettingsChange = useCallback((settings: CompanySettings) => {
    setLocalSettings(settings)
  }, [setLocalSettings])

  const handleSave = useCallback(() => {
    const settingsToSave = localSettings || companySettings
    if (settingsToSave) {
      saveMutation.mutate(settingsToSave)
    }
  }, [localSettings, companySettings, saveMutation])

  const handleChangePassword = useCallback(async (current: string, newPassword: string): Promise<boolean> => {
    try {
      await changePassword(newPassword)
      showFeedback('Senha alterada com sucesso!')
      return true
    } catch (error) {
      showFeedback('Erro ao alterar senha: ' + (error as Error).message, 'error')
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