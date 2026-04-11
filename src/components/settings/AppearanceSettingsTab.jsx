import React from 'react'
import { Save } from 'lucide-react'
import Button from '../ui/Button'

const AppearanceSettingsTab = ({ settings, setSettings, onSave, saving }) => {
  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value })
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Personalização Visual</h2>
      
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Cores do Tema</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor Primária</label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: settings.primary_color }}
                />
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="w-16 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={(e) => handleChange('primary_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Usada em botões, links e destaques</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor Secundária</label>
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: settings.secondary_color }}
                />
                <input
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="w-16 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondary_color}
                  onChange={(e) => handleChange('secondary_color', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Usada em elementos secundários e gradientes</p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-lg" style={{ background: `linear-gradient(135deg, ${settings.primary_color}20, ${settings.secondary_color}20)` }}>
            <p className="text-sm font-medium mb-2">Preview</p>
            <div className="flex gap-2">
              <div className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: settings.primary_color }}>
                Primária
              </div>
              <div className="px-4 py-2 rounded-lg text-white" style={{ backgroundColor: settings.secondary_color }}>
                Secundária
              </div>
              <div className="px-4 py-2 rounded-lg text-white" style={{ background: `linear-gradient(135deg, ${settings.primary_color}, ${settings.secondary_color})` }}>
                Gradiente
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-6 pt-6">
        <Button onClick={onSave} loading={saving} icon={Save}>Salvar Configurações</Button>
      </div>
    </div>
  )
}

export default AppearanceSettingsTab