import React, { useEffect } from 'react'
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from '../../lib/icons'

const FeedbackMessage = ({ 
  type = 'success',
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
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-300',
      iconColor: 'text-green-500 dark:text-green-400'
    },
    error: {
      icon: AlertCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-300',
      iconColor: 'text-red-500 dark:text-red-400'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-300',
      iconColor: 'text-yellow-500 dark:text-yellow-400'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-300',
      iconColor: 'text-blue-500 dark:text-blue-400'
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