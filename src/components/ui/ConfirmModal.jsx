import React, { useMemo, useCallback, useState } from 'react'
import { AlertTriangle, Info, HelpCircle, CheckCircle } from '@lib/icons'
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
  variant = 'warning',
  loading: externalLoading = false, // Renomeado para evitar conflito
  size = 'sm',
  customIcon = null, // Nova prop: permite ícone customizado
  confirmButtonProps = {}, // Nova prop: props extras para botão confirmar
  cancelButtonProps = {}, // Nova prop: props extras para botão cancelar
  closeOnConfirm = true, // Nova prop: controla se fecha após confirmar
  hideCancel = false, // Nova prop: esconde botão cancelar
  centered = true, // Nova prop: centraliza conteúdo verticalmente
}) => {
  // Estado interno para loading quando onConfirm é async
  const [internalLoading, setInternalLoading] = useState(false)
  const isLoading = externalLoading || internalLoading

  // Configurações de variantes memoizadas
  const variants = useMemo(() => ({
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      confirmVariant: 'warning',
      role: 'alertdialog'
    },
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-500 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      confirmVariant: 'danger',
      role: 'alertdialog'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-500 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      confirmVariant: 'primary',
      role: 'dialog'
    },
    success: {
      icon: CheckCircle, // Alterado de HelpCircle para CheckCircle (mais adequado)
      iconColor: 'text-green-500 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      confirmVariant: 'success',
      role: 'dialog'
    }
  }), [])

  const config = variants[variant] || variants.warning
  
  // Permite ícone customizado ou usa o padrão da variante
  const Icon = customIcon || config.icon

  // Handler inteligente para confirmação
  const handleConfirm = useCallback(async () => {
    if (isLoading) return

    try {
      // Se onConfirm é uma função async, gerencia loading automaticamente
      if (onConfirm) {
        const result = onConfirm()
        
        if (result instanceof Promise) {
          setInternalLoading(true)
          await result
        }
      }
      
      // Fecha o modal se especificado
      if (closeOnConfirm) {
        onClose?.()
      }
    } catch (error) {
      console.error('Erro na confirmação:', error)
      // Aqui você poderia emitir um toast de erro, por exemplo
    } finally {
      setInternalLoading(false)
    }
  }, [onConfirm, onClose, closeOnConfirm, isLoading])

  // Handler para cancelar (com suporte a promessas)
  const handleCancel = useCallback(async () => {
    if (isLoading) return
    
    try {
      const result = onClose?.()
      if (result instanceof Promise) {
        await result
      }
    } catch (error) {
      console.error('Erro ao cancelar:', error)
    }
  }, [onClose, isLoading])

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size={size}
      zIndex={100}
      isLoading={isLoading}
      // Props de acessibilidade
      role={config.role}
      aria-describedby="confirm-modal-description"
    >
      <div className={`space-y-4 ${centered ? 'text-center' : ''}`}>
        <div className={`flex ${centered ? 'flex-col items-center' : 'items-start'} gap-3`}>
          {/* Ícone com animação sutil */}
          <div className={`
            w-12 h-12 ${config.iconBg} rounded-full 
            flex items-center justify-center flex-shrink-0
            transition-transform duration-200
            ${isOpen ? 'scale-100' : 'scale-90'}
          `}>
            <Icon size={22} className={config.iconColor} aria-hidden="true" />
          </div>
          
          {/* Mensagem */}
          <div 
            id="confirm-modal-description"
            className={`flex-1 text-gray-700 dark:text-gray-300 ${centered ? 'text-center' : 'text-left'}`}
          >
            {typeof message === 'string' ? (
              <p className="text-sm sm:text-base leading-relaxed">{message}</p>
            ) : (
              message
            )}
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className={`
        flex ${centered ? 'justify-center' : 'justify-end'} 
        gap-3 mt-6 pt-4 border-t dark:border-gray-700
      `}>
        {/* Só mostra botão cancelar se cancelText não for string vazia */}
        {!hideCancel && cancelText !== "" && (
          <Button 
            variant="outline" 
            onClick={handleCancel} 
            disabled={isLoading}
            {...cancelButtonProps}
          >
            {cancelText}
          </Button>
        )}
        
        <Button 
          variant={config.confirmVariant} 
          onClick={handleConfirm} 
          loading={isLoading}
          disabled={isLoading}
          // Se não tiver cancelar, o botão OK ocupa largura total (opcional)
          className={cancelText === "" ? "w-full" : ""}
          {...confirmButtonProps}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}

export default ConfirmModal