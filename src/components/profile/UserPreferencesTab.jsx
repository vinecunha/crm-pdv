// src/components/profile/UserPreferencesTab.jsx
import React from 'react'
import { Save, Moon, Sun, LayoutGrid, AlignJustify } from '../../lib/icons'
import Button from '../ui/Button'

const UserPreferencesTab = ({ preferences, setPreferences, onSave, saving }) => {
  const handleChange = (field, value) => {
    setPreferences({ ...preferences, [field]: value })
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 dark:text-white">
        Preferências de Interface
      </h2>
      
      <div className="space-y-6">
        {/* Tema */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 mb-4 dark:text-white">Tema</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleChange('dark_mode', false)}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                !preferences?.dark_mode 
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Sun size={32} className={!preferences?.dark_mode ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
              <span className={`font-medium ${!preferences?.dark_mode ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                Claro
              </span>
            </button>
            
            <button
              onClick={() => handleChange('dark_mode', true)}
              className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                preferences?.dark_mode 
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30' 
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <Moon size={32} className={preferences?.dark_mode ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'} />
              <span className={`font-medium ${preferences?.dark_mode ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>
                Escuro
              </span>
            </button>
          </div>
        </div>

        {/* Densidade da Tabela */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 mb-4 dark:text-white">Densidade das Tabelas</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'compact', label: 'Compacto', icon: AlignJustify },
              { id: 'comfortable', label: 'Confortável', icon: LayoutGrid },
              { id: 'spacious', label: 'Espaçoso', icon: LayoutGrid }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleChange('table_density', id)}
                className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-1 ${
                  preferences?.table_density === id || (!preferences?.table_density && id === 'comfortable')
                    ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <Icon size={20} className={
                  preferences?.table_density === id || (!preferences?.table_density && id === 'comfortable')
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-400'
                } />
                <span className={`text-sm ${
                  preferences?.table_density === id || (!preferences?.table_density && id === 'comfortable')
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Collapsed */}
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Sidebar Recolhida</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Manter menu lateral recolhido por padrão
              </p>
            </div>
            <button
              onClick={() => handleChange('sidebar_collapsed', !preferences?.sidebar_collapsed)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences?.sidebar_collapsed ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                preferences?.sidebar_collapsed ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-6 pt-6 dark:border-gray-700">
        <Button onClick={onSave} loading={saving} icon={Save}>
          Salvar Preferências
        </Button>
      </div>
    </div>
  )
}

export default UserPreferencesTab