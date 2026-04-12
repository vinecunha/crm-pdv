import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { secureStorage } from '../utils/secureStorage' // ADICIONAR IMPORT
import {
  User, Save, RotateCcw, Shield, Key
} from 'lucide-react'
import Button from '../components/ui/Button'
import FeedbackMessage from '../components/ui/FeedbackMessage'
import DataLoadingSkeleton from '../components/ui/DataLoadingSkeleton'
import AvatarUploader from '../components/profile/AvatarUploader'
import ProfileInfoForm from '../components/profile/ProfileInfoForm'
import SecuritySection from '../components/profile/SecuritySection'
import ChangePasswordModal from '../components/profile/ChangePasswordModal'

const Profile = () => {
  const { profile, user, refreshSession, changePassword, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState({ show: false, type: 'success', message: '' })
  const [activeTab, setActiveTab] = useState('profile')
  
  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '', // ADICIONAR
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
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  useEffect(() => {
    if (profile) {
      loadProfileData()
    }
  }, [profile])

  const loadProfileData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          display_name: data.display_name || '', // ADICIONAR
          email: data.email || user?.email || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip_code: data.zip_code || '',
          birth_date: data.birth_date || '',
          document: data.document || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      showFeedback('error', 'Erro ao carregar dados do perfil')
    } finally {
      setLoading(false)
    }
  }

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

  const handleSaveProfile = async () => {
    if (!validateForm()) return
    
    setSaving(true)
    try {
      const updateData = {
        display_name: formData.display_name || null,
        phone: formData.phone || null,
        avatar_url: formData.avatar_url || null,
        address: formData.address || null,
        city: formData.city || null,
        state: formData.state || null,
        zip_code: formData.zip_code || null,
        birth_date: formData.birth_date || null,
        document: formData.document || null,
        updated_at: new Date().toISOString()
      }

      console.log('📝 Salvando perfil:', updateData)

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user?.id)

      if (error) throw error

      console.log('✅ Perfil salvo no banco')

      // Recarregar o perfil do banco
      const { data: freshProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (freshProfile) {
        // Atualizar secureStorage
        secureStorage.set('profile', freshProfile)
        console.log('✅ SecureStorage atualizado')
      }

      // Recarregar a página para atualizar todos os componentes
      showFeedback('success', 'Perfil atualizado! Recarregando...')
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Erro ao salvar perfil:', error)
      showFeedback('error', 'Erro ao salvar perfil: ' + error.message)
    } finally {
      setSaving(false)
    }
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
    { id: 'security', label: 'Segurança', icon: Shield }
  ]

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    gerente: 'bg-blue-100 text-blue-800',
    operador: 'bg-gray-100 text-gray-800'
  }

  const roleNames = {
    admin: 'Administrador',
    gerente: 'Gerente',
    operador: 'Operador'
  }

  // Nome de exibição para o avatar
  const displayNameForAvatar = formData.display_name || formData.full_name || 'Usuário'

  if (loading) {
    return <DataLoadingSkeleton type="cards" rows={3} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="text-blue-600" />
            Meu Perfil
          </h1>
          <p className="text-gray-600 mt-1">
            Gerencie suas informações pessoais e configurações de conta
          </p>
        </div>

        {feedback.show && (
          <div className="mb-4">
            <FeedbackMessage
              type={feedback.type}
              message={feedback.message}
              onClose={() => setFeedback({ show: false })}
            />
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-72 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <AvatarUploader
                user={user}
                avatarUrl={formData.avatar_url}
                fullName={formData.full_name}
                displayName={displayNameForAvatar}
                onAvatarUpdate={handleAvatarUpdate}
              />

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                {displayNameForAvatar}
              </h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              
              <div className="mt-2">
                <span className={`
                  inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                  ${roleColors[profile?.role] || 'bg-gray-100 text-gray-800'}
                `}>
                  <Shield size={12} className="mr-1" />
                  {roleNames[profile?.role] || 'Usuário'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.login_count || 0}
                  </p>
                  <p className="text-xs text-gray-500">Logins</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    {profile?.last_login 
                      ? new Date(profile.last_login).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                      : '-'}
                  </p>
                  <p className="text-xs text-gray-500">Último acesso</p>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all
                        ${activeTab === tab.id 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <Icon size={18} />
                      <span className="text-sm">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {activeTab === 'profile' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Informações Pessoais
                  </h3>

                  <ProfileInfoForm
                    formData={formData}
                    formErrors={formErrors}
                    onChange={handleInputChange}
                  />

                  {hasChanges && (
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                      <Button variant="outline" onClick={loadProfileData}>
                        <RotateCcw size={16} className="mr-1" />
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveProfile} loading={saving}>
                        <Save size={16} className="mr-1" />
                        Salvar Alterações
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Segurança da Conta
                  </h3>

                  <SecuritySection
                    user={user}
                    onChangePassword={() => setShowPasswordModal(true)}
                    onLogout={logout}
                  />
                </div>
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