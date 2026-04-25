// src/components/settings/SettingsSidebar.jsx
import React from 'react'
import { Building2, Palette, Shield, Lock } from '@lib/icons'

const SettingsSidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'permissions', label: 'Permissões', icon: Shield },
    { id: 'security', label: 'Segurança', icon: Lock }
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Mobile: scroll horizontal */}
      <nav className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible p-1.5 sm:p-2 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg transition-all whitespace-nowrap
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }
                lg:w-full
              `}
            >
              <Icon size={16} />
              <span className="text-xs sm:text-sm">{tab.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default SettingsSidebar
