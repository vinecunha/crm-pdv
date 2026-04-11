import React from 'react'
import { Clock } from 'lucide-react'

export const BlockedAlert = ({ timeRemaining, formatTimeRemaining }) => {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-center gap-2 text-orange-800 mb-1">
        <Clock size={18} />
        <span className="font-medium">Acesso bloqueado</span>
      </div>
      <p className="text-sm text-orange-700">
        Muitas tentativas incorretas. Tente novamente em {formatTimeRemaining(timeRemaining)}.
      </p>
    </div>
  )
}

export const AttemptsIndicator = ({ remainingAttempts, primaryColor }) => {
  if (remainingAttempts >= 5 || remainingAttempts <= 0) return null

  return (
    <div 
      className="border rounded-lg p-3"
      style={{ 
        backgroundColor: `${primaryColor}10`,
        borderColor: `${primaryColor}30`
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: primaryColor }}>
          Tentativas restantes:
        </span>
        <span className="text-sm font-medium" style={{ color: primaryColor }}>
          {remainingAttempts} de 5
        </span>
      </div>
      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
        <div 
          className="h-1.5 rounded-full transition-all"
          style={{ 
            width: `${(remainingAttempts / 5) * 100}%`,
            backgroundColor: primaryColor
          }}
        />
      </div>
    </div>
  )
}