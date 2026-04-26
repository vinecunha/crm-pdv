import React, { useMemo, useCallback, useState } from 'react'
import { AlertTriangle, Info, CheckCircle, X } from '@lib/icons'
import { logger } from '@utils/logger'

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Ação',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  loading: externalLoading = false,
  size = 'sm',
  customIcon = null,
  confirmButtonProps = {},
  cancelButtonProps = {},
  closeOnConfirm = true,
  hideCancel = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = externalLoading || internalLoading

  const variants = useMemo(() => ({
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      confirmVariant: 'warning'
    },
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-500 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      confirmVariant: 'danger'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      confirmVariant: 'primary'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-500 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      confirmVariant: 'success'
    }
  }), [])

  const config = variants[variant] || variants.warning
  const Icon = customIcon || config.icon

  const handleConfirm = useCallback(async () => {
    if (isLoading) return

    try {
      if (onConfirm) {
        const result = onConfirm()
        if (result instanceof Promise) {
          setInternalLoading(true)
          await result
        }
      }
      if (closeOnConfirm) {
        onClose?.()
      }
    } catch (error) {
      logger.error('Erro na confirmação:', error)
    } finally {
      setInternalLoading(false)
    }
  }, [onConfirm, onClose, closeOnConfirm, isLoading])

  const handleCancel = useCallback(async () => {
    if (isLoading) return
    try {
      const result = onClose?.()
      if (result instanceof Promise) {
        await result
      }
    } catch (error) {
      logger.error('Erro ao cancelar:', error)
    }
  }, [onClose, isLoading])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={!isLoading ? handleCancel : undefined}
      />
      
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full ${sizes[size]} p-6 animate-slideUp`}>
        <div className="text-center">
          <div className={`
            w-12 h-12 ${config.iconBg} rounded-full 
            flex items-center justify-center mx-auto mb-4
          `}>
            <Icon size={24} className={config.iconColor} />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title}
          </h3>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {message}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {!hideCancel && cancelText !== "" && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 
                bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 
                dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              {...cancelButtonProps}
            >
              {cancelText}
            </button>
          )}
          
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`
              flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50
              ${variant === 'danger' || variant === 'warning' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
              }
            `}
            {...confirmButtonProps}
          >
            {isLoading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
            ) : null}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal