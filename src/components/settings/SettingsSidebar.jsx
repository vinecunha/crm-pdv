import React from 'react'
import { Building2, Palette, Shield, Lock } from 'lucide-react'

const SettingsSidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'company', label: 'Empresa', icon: Building2 },
    { id: 'appearance', label: 'Aparência', icon: Palette },
    { id: 'permissions', label: 'Permissões', icon: Shield },
    { id: 'security', label: 'Segurança', icon: Lock }
  ]

  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 sticky top-6 overflow-hidden">
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
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
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