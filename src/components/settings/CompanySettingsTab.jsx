import React, { useState } from 'react'
import { Image as ImageIcon, X, Save } from 'lucide-react'
import Button from '../ui/Button'

const CompanySettingsTab = ({ settings, setSettings, onSave, saving }) => {
  const [availableLogos] = useState([
    { name: 'Logo Padrão', path: '/brasalino-pollo.png' },
    { name: 'Logo Dark', path: '/logo-dark.png' },
    { name: 'Logo Light', path: '/logo-light.png' },
    { name: 'Logo Branca', path: '/logo-white.png' },
    { name: 'Logo Azul', path: '/logo-blue.png' }
  ])

  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value })
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Informações da Empresa</h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo da Empresa</label>
          
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-32 h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
              {settings.company_logo_url ? (
                <img 
                  src={settings.company_logo_url} 
                  alt="Logo" 
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { e.target.src = '/brasalino-pollo.png' }}
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>

            <div className="flex-1 space-y-3">
              <select
                value={settings.company_logo_url}
                onChange={(e) => handleChange('company_logo_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione uma logo</option>
                {availableLogos.map((logo) => (
                  <option key={logo.path} value={logo.path}>{logo.name}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.company_logo_url}
                  onChange={(e) => handleChange('company_logo_url', e.target.value)}
                  placeholder="/caminho/logo.png"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => handleChange('company_logo_url', '')}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa *</label>
          <input
            type="text"
            value={settings.company_name}
            onChange={(e) => handleChange('company_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Nome da sua empresa"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
            <input
              type="text"
              value={settings.cnpj}
              onChange={(e) => handleChange('cnpj', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="00.000.000/0001-00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="contato@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
            <input
              type="text"
              value={settings.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="(00) 0000-0000"
              mask="phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Domínio</label>
            <input
              type="text"
              value={settings.domain}
              onChange={(e) => handleChange('domain', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="www.empresa.com.br"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <input
              type="text"
              value={settings.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Rua, número"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              type="text"
              value={settings.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Cidade"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <input
              type="text"
              value={settings.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="UF"
              maxLength={2}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 mt-6 pt-6">
        <Button onClick={onSave} loading={saving} icon={Save}>Salvar Configurações</Button>
      </div>
    </div>
  )
}

export default CompanySettingsTab