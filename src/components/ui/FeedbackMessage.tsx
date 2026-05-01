import React, { useEffect, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  X, 
  AlertTriangle
} from '@lib/icons'

const FeedbackMessage = ({ 
  type = 'success',
  message, 
  onClose,
  position = 'static',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  
  const handleClose = useCallback(() => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 300)
  }, [onClose])
  
  // Auto-close after 5 seconds
  useEffect(() => {
    if (!onClose) return
    
    const timer = setTimeout(() => {
      if (!isHovered) {
        handleClose()
      }
    }, 5000)
    
    return () => clearTimeout(timer)
  }, [onClose, isHovered, handleClose])
  
  // Announce errors to screen readers
  useEffect(() => {
    if (message && type === 'error') {
      const announcement = `Erro: ${message}`
      const ariaLive = document.createElement('div')
      ariaLive.setAttribute('aria-live', 'assertive')
      ariaLive.setAttribute('role', 'alert')
      ariaLive.textContent = announcement
      document.body.appendChild(ariaLive)
      
      setTimeout(() => document.body.removeChild(ariaLive), 1000)
    }
  }, [message, type])
  
  const configs = {
    success: {
      icon: CheckCircle,
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-300',
      iconColor: 'text-green-500 dark:text-green-400'
    },
    error: {
      icon: AlertCircle,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-300',
      iconColor: 'text-red-500 dark:text-red-400'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-300',
      iconColor: 'text-yellow-500 dark:text-yellow-400'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-300',
      iconColor: 'text-blue-500 dark:text-blue-400'
    }
  }
  
  const { icon: Icon, bg, border, text, iconColor } = configs[type]
  const isBottomToast = position === 'absolute-bottom'
  const toastBg = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
  
  const positionClasses = {
    static: '',
    fixed: 'fixed top-4 right-4 z-50 max-w-md',
    'fixed-bottom': 'fixed bottom-4 right-4 z-50 max-w-md',
    'fixed-top-center': 'fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4',
    'absolute-bottom': `fixed top-4 left-4 right-4 z-50 max-w-md mx-auto px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-right duration-300 ${toastBg}`
  }
  
  if (!message || !isVisible) return null
    
  const messageContent = (
    <div
      ref={useRef(null)}
      className={`
        ${isBottomToast ? '' : `${bg} ${border} border rounded-lg`} 
        p-4 flex items-start gap-3
        transform transition-all duration-300
        ${position !== 'static' && position !== 'absolute-bottom' && isLeaving 
          ? 'opacity-0 translate-x-full scale-95' 
          : position === 'absolute-bottom' && isLeaving
            ? 'opacity-0 translate-y-full scale-95'
            : position !== 'static'
              ? 'opacity-100 translate-x-0 scale-100'
              : isLeaving
                ? 'opacity-0 translate-y-2'
                : 'opacity-100 translate-y-0'
        }
        ${position !== 'static' ? 'shadow-xl hover:shadow-2xl' : 'shadow-lg hover:shadow-xl'}
        ${className}
      `}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ícone */}
      <div className="flex-shrink-0">
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      
      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <p className={`${text} font-medium text-sm`}>
          {message}
        </p>
      </div>
      
      {/* Botão fechar */}
      {onClose && (
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0
            ${text} opacity-60 hover:opacity-100 
            transition-opacity duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            focus-visible:ring-${type}-500 rounded
            p-1
          `}
          aria-label="Fechar mensagem"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
  
  // Se position for 'static', renderiza inline
  if (position === 'static') {
    return messageContent
  }
  
  // Para posições fixed, renderiza como toast no portal
  return createPortal(messageContent, document.body)
}

export default FeedbackMessage
