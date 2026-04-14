import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from '../../lib/icons'

const FeedbackMessage = ({ 
  type = 'success', // 'success', 'error', 'warning', 'info'
  message, 
  onClose, 
  duration = 5000,
  showIcon = true,
  closable = true
}) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const config = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      iconColor: 'text-green-500'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      iconColor: 'text-red-500'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-500'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-500'
    }
  }

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type]

  if (!message) return null

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4 mb-4 flex items-start gap-3 animate-in slide-in-from-top-2`}>
      {showIcon && (
        <div className="flex-shrink-0">
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      )}
      <div className="flex-1">
        <p className={`text-sm font-medium ${textColor}`}>{message}</p>
      </div>
      {closable && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ${textColor} hover:opacity-70 transition-opacity`}
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default FeedbackMessage