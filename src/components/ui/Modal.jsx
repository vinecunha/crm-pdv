import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertCircle } from '@lib/icons'

const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return
    
    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [isLocked])
}

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  isLoading = false,
  error = null,      
  onRetry = null,
  zIndex = 50
}) => {
  const modalRef = useRef(null)
  
  useScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen || isLoading) return
    
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, isLoading, onClose])

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto" 
      style={{ zIndex }}
      aria-modal="true"
      role="dialog"
      aria-label={title}
    >
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay - Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 transition-opacity"
          onClick={!isLoading ? onClose : undefined}
          aria-hidden="true"
        />
        
        {/* Modal Container */}
        <div 
          ref={modalRef}
          tabIndex={-1} // Permite foco programático
          className={`relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full ${sizes[size]} transform transition-all outline-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {!isLoading && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Fechar modal"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          {/* Body */}
          <div className="p-4 sm:p-6">
            {error && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">Erro</p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">{error}</p>
                  </div>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium px-2 py-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                    >
                      Tentar novamente
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {children}
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }
  
  return modalContent
}

export default Modal