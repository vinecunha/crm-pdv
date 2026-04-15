import React from 'react'
import { AlertTriangle, Info, HelpCircle } from '../../lib/icons'
import Modal from './Modal'
import Button from './Button'

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar Ação',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning', // 'warning', 'danger', 'info', 'success'
  loading = false,
  size = 'sm'
}) => {
  const variants = {
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      iconBg: 'bg-yellow-100',
      confirmVariant: 'warning'
    },
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-100',
      confirmVariant: 'danger'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-100',
      confirmVariant: 'primary'
    },
    success: {
      icon: HelpCircle,
      iconColor: 'text-green-500',
      iconBg: 'bg-green-100',
      confirmVariant: 'success'
    }
  }

  const config = variants[variant] || variants.warning
  const Icon = config.icon

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      zIndex={100}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 ${config.iconBg} rounded-full flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={config.iconColor} />
          </div>
          <div className="flex-1 text-gray-700">
            {typeof message === 'string' ? <p>{message}</p> : message}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button 
          variant={config.confirmVariant} 
          onClick={onConfirm} 
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmModal