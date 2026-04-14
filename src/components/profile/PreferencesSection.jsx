// components/profile/PreferencesSection.jsx - Versão Simplificada
import React from 'react'
import { Settings, Clock } from '../../lib/icons'

const PreferencesSection = () => {
  return (
    <div className="space-y-6">
      {/* Mensagem de "Em Breve" */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Settings size={32} className="text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Preferências em breve
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Estamos preparando novas opções de personalização para você.
        </p>
        <p className="text-sm text-gray-500 mt-4 flex items-center justify-center gap-2">
          <Clock size={14} />
          Disponível na próxima atualização
        </p>
      </div>

      {/* Cards de funcionalidades futuras */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-60">
          <div className="w-8 h-8 bg-gray-200 rounded-lg mb-2" />
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
          <div className="h-2 bg-gray-200 rounded w-1/2" />
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 opacity-60">
          <div className="w-8 h-8 bg-gray-200 rounded-lg mb-2" />
          <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
          <div className="h-2 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

export default PreferencesSection