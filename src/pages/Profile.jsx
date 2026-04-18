import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { secureStorage } from '../utils/secureStorage'
import {
  User, Save, RotateCcw, Shield, Settings,
} from '../lib/icons'
import { sanitizeObject } from '../utils/sanitize'
import Button from '../components/ui/Button'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import PageHeader from '../components/ui/PageHeader'
import AvatarUploader from '../components/profile/AvatarUploader'
import ProfileInfoForm from '../components/profile/ProfileInfoForm'
import SecuritySection from '../components/profile/SecuritySection'
import ChangePasswordModal from '../components/profile/ChangePasswordModal'
import UserPreferencesTab from '../components/profile/UserPreferencesTab'

const fetchProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

const Profile = () => {
  const { profile, user, changePassword, logout } = useAuth()
  const queryClient = useQueryClient()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    email: '',
    phone: '',
    avatar_url: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    birth_date: '',
    document: ''
  })
  
  const [hasChanges, setHasChanges] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const { 
    data: profileData,
    isLoading,
    error: profileError,
    refetch
  } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => fetchProfile(user?.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })

  const [preferences, setPreferences] = useState({
    dark_mode: false,
    theme_mode: 'manual',
    sidebar_collapsed: false,
    table_density: 'comfortable'
  })

  const updateMutation = useMutation({
    mutationFn: async ({ userId, profileData, preferences }) => {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name || null,
          phone: profileData.phone || null,
          avatar_url: profileData.avatar_url || null,
          address: profileData.address || null,
          city: profileData.city || null,
          state: profileData.state || null,
          zip_code: profileData.zip_code || null,
          birth_date: profileData.birth_date || null,
          document: profileData.document || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (profileError) throw profileError

      if (preferences) {
        const { error: prefsError } = await supabase.rpc('update_user_preferences', {
          p_user_id: userId,
          p_dark_mode: preferences.dark_mode ?? null,
          p_sidebar_collapsed: preferences.sidebar_collapsed ?? null,
          p_table_density: preferences.table_density ?? null
        })

        if (prefsError) throw prefsError
        
        // Atualizar theme_mode separadamente
        if (preferences.theme_mode) {
          await supabase
            .from('profiles')
            .update({ theme_mode: preferences.theme_mode })
            .eq('id', userId)
        }
      }

      const { data: freshProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError
      return freshProfile
    },
    onSuccess: (freshProfile) => {
      queryClient.setQueryData(['profile', user?.id], freshProfile)
      secureStorage.set('profile', freshProfile)
      showFeedback('success', 'Perfil atualizado com sucesso!')
      setHasChanges(false)
    },
    onError: (error) => {
      console.error('Erro ao salvar perfil:', error)
      showFeedback('error', 'Erro ao salvar perfil: ' + error.message)
    }
  })

  useEffect(() => {
    if (profileData) {
      setFormData({
        full_name: profileData.full_name || '',
        display_name: profileData.display_name || '',
        email: profileData.email || user?.email || '',
        phone: profileData.phone || '',
        avatar_url: profileData.avatar_url || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        zip_code: profileData.zip_code || '',
        birth_date: profileData.birth_date || '',
        document: profileData.document || ''
      })
      
      setPreferences({
        dark_mode: profileData.dark_mode || false,
        theme_mode: profileData.theme_mode || 'manual',
        sidebar_collapsed: profileData.sidebar_collapsed || false,
        table_density: profileData.table_density || 'comfortable'
      })
    }
  }, [profileData, user])

  const showFeedback = (type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setHasChanges(true)
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleSavePreferences = () => {
    updateMutation.mutate({
      userId: user?.id,
      profileData: formData,
      preferences: {
        dark_mode: preferences.dark_mode,
        theme_mode: preferences.theme_mode,
        sidebar_collapsed: preferences.sidebar_collapsed,
        table_density: preferences.table_density
      }
    })
  }

  const validateForm = () => {
    const errors = {}
    
    if (formData.phone && !/^[\d\s\(\)-]+$/.test(formData.phone)) {
      errors.phone = 'Telefone inválido'
    }
    
    if (formData.document && formData.document.length < 11) {
      errors.document = 'Documento inválido'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProfile = () => {
    if (!validateForm()) return
    
    updateMutation.mutate({
      userId: user?.id,
      profileData: formData,
      preferences: preferences
    })
  }

  const handleCancelChanges = () => {
    if (profileData) {
      setFormData({
        full_name: profileData.full_name || '',
        display_name: profileData.display_name || '',
        email: profileData.email || user?.email || '',
        phone: profileData.phone || '',
        avatar_url: profileData.avatar_url || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        zip_code: profileData.zip_code || '',
        birth_date: profileData.birth_date || '',
        document: profileData.document || ''
      })
    }
    setHasChanges(false)
    setFormErrors({})
  }

  const handleAvatarUpdate = (newAvatarUrl) => {
    setFormData(prev => ({ ...prev, avatar_url: newAvatarUrl }))
    setHasChanges(true)
  }

  const handleChangePassword = async (currentPassword, newPassword) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email,
      password: currentPassword
    })

    if (signInError) {
      throw new Error('Senha atual incorreta')
    }

    await changePassword(newPassword)

    setTimeout(() => {
      logout()
    }, 2000)
  }

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'preferences', label: 'Preferências', icon: Settings },
    { id: 'security', label: 'Segurança', icon: Shield }
  ]

  const roleColors = {
    admin: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
    gerente: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    operador: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
  }

  const roleNames = {
    admin: 'Administrador',
    gerente: 'Gerente',
    operador: 'Operador'
  }

  const displayNameForAvatar = formData.display_name || formData.full_name || 'Usuário'

  if (profileError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-black flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Erro ao carregar perfil</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{profileError.message}</p>
          <Button onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <DataLoadingSkeleton type="cards" rows={3} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false })}
            />
          </div>
        )}

        <PageHeader
          title="Meu Perfil"
          description="Gerencie suas informações pessoais e configurações de conta"
          icon={User}
        />

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 text-center">
              <AvatarUploader
                user={user}
                avatarUrl={formData.avatar_url}
                fullName={formData.full_name}
                displayName={displayNameForAvatar}
                onAvatarUpdate={handleAvatarUpdate}
              />

              <h2 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {displayNameForAvatar}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-all">{user?.email}</p>
              
              <div className="mt-2">
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${roleColors[profile?.role] || 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'}
                `}>
                  <Shield size={10} className="mr-1" />
                  {roleNames[profile?.role] || 'Usuário'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {profileData?.login_count || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Logins</p>
                </div>
                <div className="text-center">
                  <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                    {profileData?.last_login 
                      ? new Date(profileData.last_login).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                      : '-'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Último acesso</p>
                </div>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mt-3 sm:mt-4 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-1.5 sm:p-2">
              <nav className="space-y-0.5 sm:space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all
                        ${activeTab === tab.id 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }
                      `}
                    >
                      <Icon size={16} />
                      <span className="text-xs sm:text-sm">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {activeTab === 'profile' && (
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Informações Pessoais
                  </h3>

                  <ProfileInfoForm
                    formData={formData}
                    formErrors={formErrors}
                    onChange={handleInputChange}
                    disabled={updateMutation.isPending}
                  />

                  {hasChanges && (
                    <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t dark:border-gray-700">
                      <Button 
                        variant="outline" 
                        onClick={handleCancelChanges}
                        disabled={updateMutation.isPending}
                        className="order-2 sm:order-1"
                        size="sm"
                      >
                        <RotateCcw size={16} className="mr-1" />
                        Cancelar
                      </Button>
                      <Button 
                        onClick={handleSaveProfile} 
                        loading={updateMutation.isPending}
                        className="order-1 sm:order-2"
                        size="sm"
                      >
                        <Save size={16} className="mr-1" />
                        Salvar Alterações
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">
                    Segurança da Conta
                  </h3>

                  <SecuritySection
                    user={user}
                    onChangePassword={() => setShowPasswordModal(true)}
                    onLogout={logout}
                  />
                </div>
              )}

              {activeTab === 'preferences' && (
                <UserPreferencesTab
                  preferences={preferences}
                  setPreferences={setPreferences}
                  onSave={handleSavePreferences}
                  saving={updateMutation.isPending}
                />
              )}
            </div>
          </div>
        </div>

        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onChangePassword={handleChangePassword}
        />
      </div>
    </div>
  )
}

export default Profile