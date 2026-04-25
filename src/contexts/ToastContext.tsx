import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import FeedbackMessage from '@/components/ui/FeedbackMessage'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
  description?: string
  duration?: number
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary' | 'link'
    icon?: React.ComponentType<{ size?: number }>
  }>
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (type: ToastType, message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => void
  success: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => void
  error: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => void
  warning: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => void
  info: (message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0
const generateId = () => `toast-${++toastId}`

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((type: ToastType, message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    const id = generateId()
    const newToast: Toast = {
      id,
      type,
      message,
      duration: options?.duration ?? 5000,
      description: options?.description,
      actions: options?.actions,
    }

    setToasts(prev => [...prev, newToast])

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => removeToast(id), newToast.duration)
    }
  }, [removeToast])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  const toast = useCallback((type: ToastType, message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    addToast(type, message, options)
  }, [addToast])

  const success = useCallback((message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    addToast('success', message, options)
  }, [addToast])

  const error = useCallback((message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    addToast('error', message, options)
  }, [addToast])

  const warning = useCallback((message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    addToast('warning', message, options)
  }, [addToast])

  const info = useCallback((message: string, options?: Omit<Toast, 'id' | 'type' | 'message'>) => {
    addToast('info', message, options)
  }, [addToast])

  useEffect(() => {
    if (!containerRef.current) {
      containerRef.current = document.createElement('div')
      containerRef.current.id = 'toast-container'
      document.body.appendChild(containerRef.current)
    }

    return () => {
      if (containerRef.current && document.body.contains(containerRef.current)) {
        document.body.removeChild(containerRef.current)
      }
    }
  }, [])

  const toastContainer = (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((t, index) => (
        <div 
          key={t.id} 
          className="pointer-events-auto"
          style={{ 
            animation: 'slideIn 0.3s ease-out',
            animationDelay: `${index * 50}ms`
          }}
        >
          <FeedbackMessage
            type={t.type}
            message={t.message}
            description={t.description}
            duration={t.duration}
            actions={t.actions}
            onClose={() => removeToast(t.id)}
            position="fixed"
            showProgress
            pauseOnHover
          />
        </div>
      ))}
    </div>
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, success, error, warning, info, removeToast, clearAll }}>
      {children}
      {containerRef.current && createPortal(toastContainer, containerRef.current)}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}