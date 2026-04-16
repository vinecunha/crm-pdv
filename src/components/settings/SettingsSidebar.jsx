import React from 'react'
import { Building2, Palette, Shield, Lock } from '../../lib/icons'

const SettingsSidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'permissions', label: 'Permissões', icon: Shield },
    { id: 'security', label: 'Segurança', icon: Lock }
  ]

  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6 overflow-hidden dark:bg-gray-800 dark:border-gray-700">
        <nav className="p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium dark:bg-blue-900/30 dark:text-blue-300' 
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} />
                <span className="text-sm">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export default SettingsSidebar