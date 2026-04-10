import React from 'react'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { usePasswordStrength } from '../../contexts/AuthContext'

const PasswordStrengthIndicator = ({ password }) => {
  const strength = usePasswordStrength(password)
  
  if (!password) return null
  
  return (
    <div className="mt-2 space-y-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">Força da senha:</span>
          <span className={`text-xs font-medium ${
            strength.score <= 2 ? 'text-red-600' :
            strength.score === 3 ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {strength.message}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${strength.color}`}
            style={{ width: strength.width }}
          />
        </div>
      </div>
      
      {/* Requisitos */}
      {!strength.valid && (
        <div className="space-y-1">
          <RequirementItem 
            met={password.length >= 8}
            text="Mínimo 8 caracteres"
          />
          <RequirementItem 
            met={/[A-Z]/.test(password)}
            text="Pelo menos 1 letra maiúscula"
          />
          <RequirementItem 
            met={/[a-z]/.test(password)}
            text="Pelo menos 1 letra minúscula"
          />
          <RequirementItem 
            met={/[0-9]/.test(password)}
            text="Pelo menos 1 número"
          />
          <RequirementItem 
            met={/[!@#$%^&*(),.?":{}|<>]/.test(password)}
            text="Pelo menos 1 caractere especial (opcional)"
            optional
          />
        </div>
      )}
    </div>
  )
}

const RequirementItem = ({ met, text, optional }) => {
  if (optional && !met) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <AlertCircle size={12} />
        <span>{text}</span>
        <span className="text-gray-300">(opcional)</span>
      </div>
    )
  }
  
  return (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-red-500'}`}>
      {met ? <CheckCircle size={12} /> : <XCircle size={12} />}
      <span>{text}</span>
    </div>
  )
}

export default PasswordStrengthIndicator