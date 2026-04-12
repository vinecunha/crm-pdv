import React from 'react'
import { User, Shield, BadgeCheck } from 'lucide-react'
import AvatarUploader from './AvatarUploader'

const ProfileSidebar = ({ 
  user, 
  profile, 
  formData, 
  onAvatarUpdate 
}) => {
  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'preferences', label: 'Preferências', icon: BadgeCheck }
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

  return (
    <div className="lg:w-72 flex-shrink-0">
      {/* Card do Perfil */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <AvatarUploader
          user={user}
          avatarUrl={formData.avatar_url}
          fullName={formData.full_name}
          displayName={formData.display_name}
          onAvatarUpdate={onAvatarUpdate}
        />

        <h2 className="mt-4 text-lg font-semibold text-gray-900">
          {formData.full_name || 'Usuário'}
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

        {/* Estatísticas rápidas */}
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

      {/* Abas */}
      <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => document.getElementById(`tab-${tab.id}`)?.click()}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-gray-600 hover:bg-gray-50"
              >
                <Icon size={18} />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default ProfileSidebar