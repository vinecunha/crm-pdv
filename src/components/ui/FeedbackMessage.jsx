import React, { useEffect, useState, useCallback, useRef } from 'react'
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  X, 
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Copy,
  RotateCcw
} from '../../lib/icons'

// Hook para animação de progresso
const useProgressTimer = (duration, onComplete, isPaused = false) => {
  const [progress, setProgress] = useState(100)
  const startTimeRef = useRef(null)
  const rafRef = useRef(null)
  const pausedProgressRef = useRef(null)

  useEffect(() => {
    if (!duration || isPaused) return

    startTimeRef.current = Date.now()
    const initialProgress = pausedProgressRef.current ?? 100
    setProgress(initialProgress)

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, initialProgress - (elapsed / duration) * 100)
      
      setProgress(remaining)
      
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        onComplete?.()
      }
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
      if (isPaused) {
        pausedProgressRef.current = progress
      }
    }
  }, [duration, onComplete, isPaused, initialProgress])

  return progress
}

// Componente de ação
const MessageAction = ({ action, type }) => {
  if (!action) return null

  const actionConfig = {
    primary: `text-${type}-700 dark:text-${type}-300 hover:text-${type}-900 dark:hover:text-${type}-100`,
    secondary: `text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200`,
    link: `text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline`
  }

  const Icon = action.icon || (action.external ? ExternalLink : ChevronRight)

  return (
    <button
      onClick={action.onClick}
      className={`
        inline-flex items-center gap-1 text-sm font-medium
        ${actionConfig[action.variant || 'primary']}
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        focus-visible:ring-${type}-500 rounded px-1
      `}
    >
      {action.label}
      <Icon size={14} />
    </button>
  )
}

// Componente de barra de progresso
const ProgressBar = ({ progress, type }) => {
  const colorMap = {
    success: 'bg-green-500 dark:bg-green-400',
    error: 'bg-red-500 dark:bg-red-400',
    warning: 'bg-yellow-500 dark:bg-yellow-400',
    info: 'bg-blue-500 dark:bg-blue-400'
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5 rounded-b-lg overflow-hidden">
      <div
        className={`h-full ${colorMap[type]} transition-all duration-100 ease-linear`}
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(progress)}
      />
    </div>
  )
}

// Componente de contador regressivo
const CountdownIndicator = ({ duration, type }) => {
  const [count, setCount] = useState(Math.ceil(duration / 1000))

  useEffect(() => {
    if (!duration) return

    const timer = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [duration])

  const colorMap = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400'
  }

  return (
    <span className={`text-xs font-mono ${colorMap[type]} ml-2`}>
      {count}s
    </span>
  )
}

// Hook para copiar mensagem
const useCopyToClipboard = () => {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return true
    } catch (err) {
      console.error('Failed to copy:', err)
      return false
    }
  }, [])

  return { copied, copy }
}

const FeedbackMessage = ({ 
  type = 'success',
  message, 
  description,
  onClose, 
  duration = 5000,
  showIcon = true,
  closable = true,
  showProgress = false,
  pauseOnHover = true,
  actions = [],
  onAction,
  id,
  title,
  copyable = false,
  retry,
  className = '',
  animate = true,
  position = 'static',
  compact = false,
  variant = 'default' // default, solid, outlined
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const messageRef = useRef(null)
  const { copied, copy } = useCopyToClipboard()

  const progress = useProgressTimer(
    duration,
    () => {
      if (!isHovered && onClose) {
        handleClose()
      }
    },
    isHovered && pauseOnHover
  )

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onClose?.(), 300) // Aguarda animação
  }, [onClose])

  // Auto-close com duração
  useEffect(() => {
    if (!duration || !onClose) return

    const timer = setTimeout(() => {
      if (!isHovered) {
        handleClose()
      }
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose, isHovered, handleClose])

  // Anunciar para leitores de tela
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
      colors: {
        default: {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-200 dark:border-green-800',
          text: 'text-green-800 dark:text-green-300',
          icon: 'text-green-500 dark:text-green-400'
        },
        solid: {
          bg: 'bg-green-600 dark:bg-green-700',
          border: 'border-green-700 dark:border-green-800',
          text: 'text-white dark:text-white',
          icon: 'text-white dark:text-white'
        },
        outlined: {
          bg: 'bg-transparent',
          border: 'border-2 border-green-500 dark:border-green-400',
          text: 'text-green-700 dark:text-green-300',
          icon: 'text-green-500 dark:text-green-400'
        }
      }
    },
    error: {
      icon: AlertCircle,
      colors: {
        default: {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-200 dark:border-red-800',
          text: 'text-red-800 dark:text-red-300',
          icon: 'text-red-500 dark:text-red-400'
        },
        solid: {
          bg: 'bg-red-600 dark:bg-red-700',
          border: 'border-red-700 dark:border-red-800',
          text: 'text-white dark:text-white',
          icon: 'text-white dark:text-white'
        },
        outlined: {
          bg: 'bg-transparent',
          border: 'border-2 border-red-500 dark:border-red-400',
          text: 'text-red-700 dark:text-red-300',
          icon: 'text-red-500 dark:text-red-400'
        }
      }
    },
    warning: {
      icon: AlertTriangle,
      colors: {
        default: {
          bg: 'bg-yellow-50 dark:bg-yellow-900/20',
          border: 'border-yellow-200 dark:border-yellow-800',
          text: 'text-yellow-800 dark:text-yellow-300',
          icon: 'text-yellow-500 dark:text-yellow-400'
        },
        solid: {
          bg: 'bg-yellow-500 dark:bg-yellow-600',
          border: 'border-yellow-600 dark:border-yellow-700',
          text: 'text-white dark:text-white',
          icon: 'text-white dark:text-white'
        },
        outlined: {
          bg: 'bg-transparent',
          border: 'border-2 border-yellow-500 dark:border-yellow-400',
          text: 'text-yellow-700 dark:text-yellow-300',
          icon: 'text-yellow-500 dark:text-yellow-400'
        }
      }
    },
    info: {
      icon: Info,
      colors: {
        default: {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-200 dark:border-blue-800',
          text: 'text-blue-800 dark:text-blue-300',
          icon: 'text-blue-500 dark:text-blue-400'
        },
        solid: {
          bg: 'bg-blue-600 dark:bg-blue-700',
          border: 'border-blue-700 dark:border-blue-800',
          text: 'text-white dark:text-white',
          icon: 'text-white dark:text-white'
        },
        outlined: {
          bg: 'bg-transparent',
          border: 'border-2 border-blue-500 dark:border-blue-400',
          text: 'text-blue-700 dark:text-blue-300',
          icon: 'text-blue-500 dark:text-blue-400'
        }
      }
    }
  }

  const { icon: Icon, colors } = configs[type]
  const { bg: bgColor, border: borderColor, text: textColor, icon: iconColor } = colors[variant]

  const positionClasses = {
    static: '',
    fixed: 'fixed top-4 right-4 z-50 max-w-md',
    'fixed-bottom': 'fixed bottom-4 right-4 z-50 max-w-md',
    'fixed-top-center': 'fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4'
  }

  if (!message || !isVisible) return null

  return (
    <div
      ref={messageRef}
      className={`
        ${bgColor} border ${borderColor} rounded-lg 
        ${compact ? 'p-3' : 'p-4'} 
        ${positionClasses[position]}
        flex items-start gap-3
        ${animate ? 'animate-in slide-in-from-top-2 fade-in duration-300' : ''}
        ${isVisible ? 'opacity-100' : 'opacity-0 translate-y-2'}
        transition-all duration-300
        relative overflow-hidden
        shadow-lg hover:shadow-xl
        ${className}
      `}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ícone */}
      {showIcon && (
        <div className="flex-shrink-0">
          <Icon className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} ${iconColor}`} />
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            {title && (
              <h4 className={`font-semibold ${textColor} ${compact ? 'text-sm' : 'text-base'} mb-0.5`}>
                {title}
              </h4>
            )}
            <p className={`${textColor} ${compact ? 'text-xs' : 'text-sm'} ${title ? 'opacity-90' : 'font-medium'}`}>
              {message}
            </p>
            {description && (
              <p className={`${textColor} text-xs mt-1 opacity-75`}>
                {description}
              </p>
            )}
          </div>

          {/* Badge de contagem */}
          {duration && showProgress && (
            <CountdownIndicator duration={duration} type={type} />
          )}
        </div>

        {/* Ações */}
        {(actions.length > 0 || copyable || retry) && (
          <div className="flex items-center gap-3 mt-2">
            {actions.map((action, index) => (
              <MessageAction key={index} action={action} type={type} />
            ))}
            
            {copyable && (
              <button
                onClick={() => copy(message)}
                className={`
                  inline-flex items-center gap-1 text-xs
                  ${copied ? 'text-green-600 dark:text-green-400' : `${textColor} opacity-70 hover:opacity-100`}
                  transition-all duration-200
                `}
              >
                <Copy size={12} />
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            )}

            {retry && (
              <button
                onClick={retry}
                className={`
                  inline-flex items-center gap-1 text-xs
                  ${textColor} opacity-70 hover:opacity-100
                  transition-all duration-200
                `}
              >
                <RotateCcw size={12} />
                Tentar novamente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Botão fechar */}
      {closable && (
        <button
          onClick={handleClose}
          className={`
            flex-shrink-0 ${textColor} opacity-60 hover:opacity-100 
            transition-opacity duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
            focus-visible:ring-${type}-500 rounded
            ${compact ? 'p-0.5' : 'p-1'}
          `}
          aria-label="Fechar mensagem"
        >
          <X size={compact ? 14 : 16} />
        </button>
      )}

      {/* Barra de progresso */}
      {showProgress && duration && (
        <ProgressBar progress={progress} type={type} />
      )}
    </div>
  )
}

// Container para múltiplas mensagens
export const FeedbackContainer = ({ 
  messages, 
  position = 'fixed',
  maxMessages = 3 
}) => {
  const displayMessages = messages.slice(0, maxMessages)

  return (
    <div className={`
      ${position === 'fixed' ? 'fixed top-4 right-4 z-50' : ''}
      ${position === 'fixed-bottom' ? 'fixed bottom-4 right-4 z-50' : ''}
      ${position === 'fixed-top-center' ? 'fixed top-4 left-1/2 -translate-x-1/2 z-50' : ''}
      space-y-2 w-full max-w-md
    `}>
      {displayMessages.map((msg, index) => (
        <FeedbackMessage
          key={msg.id || index}
          {...msg}
          position="static"
          animate={true}
        />
      ))}
      
      {messages.length > maxMessages && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          +{messages.length - maxMessages} mais mensagens
        </div>
      )}
    </div>
  )
}

export default FeedbackMessage