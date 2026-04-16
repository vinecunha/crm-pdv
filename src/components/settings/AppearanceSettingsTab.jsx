import React from 'react'
import { Save } from '../../lib/icons'
import Button from '../ui/Button'

const AppearanceSettingsTab = ({ settings, setSettings, onSave, saving }) => {
  const primaryColor = settings?.primary_color || '#2563eb'
  const secondaryColor = settings?.secondary_color || '#7c3aed'

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value })
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 dark:text-white">Personalização Visual</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
          <h3 className="font-medium text-gray-900 mb-4 dark:text-white">Cores do Tema</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Cor Primária</label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm dark:border-gray-600"
                  style={{ backgroundColor: primaryColor }}
                />
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="w-16 h-10 rounded border cursor-pointer dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="#2563eb"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">Usada em botões, links e destaques</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">Cor Secundária</label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm dark:border-gray-600"
                  style={{ backgroundColor: secondaryColor }}
                />
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="w-16 h-10 rounded border cursor-pointer dark:bg-gray-700 dark:border-gray-600"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="#7c3aed"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">Usada em elementos secundários e gradientes</p>
            </div>
          </div>

          <div 
            className="mt-6 p-4 rounded-lg" 
            style={{ 
              background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)` 
            }}
          >
            <p className="text-sm font-medium mb-2 dark:text-white">Preview</p>
            <div className="flex gap-2">
              <div 
                className="px-4 py-2 rounded-lg text-white" 
                style={{ backgroundColor: primaryColor }}
              >
                Primária
              </div>
              <div 
                className="px-4 py-2 rounded-lg text-white" 
                style={{ backgroundColor: secondaryColor }}
              >
                Secundária
              </div>
              <div 
                className="px-4 py-2 rounded-lg text-white" 
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` 
                }}
              >
                Gradiente
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-6 pt-6 dark:border-gray-700">
        <Button onClick={onSave} loading={saving} icon={Save}>
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}

export default AppearanceSettingsTab