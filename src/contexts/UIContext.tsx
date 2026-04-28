import { createContext, useContext, useState, useCallback } from 'react'

export interface ModalInstance {
  id: string
  name: string
  props?: Record<string, unknown>
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number
}

interface UIContextValue {
  feedback: { show: boolean; type: string; message: string }
  showFeedback: (type: string, message: string) => void
  hideFeedback: () => void
  setFeedback: React.Dispatch<React.SetStateAction<{ show: boolean; type: string; message: string }>>
  modals: ModalInstance[]
  openModal: (name: string, props?: Record<string, unknown>) => string
  closeModal: (id: string) => void
  closeAllModals: () => void
  isModalOpen: (name: string) => boolean
  getModalProps: (name: string) => Record<string, unknown> | undefined
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void
  toasts: ToastMessage[]
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => string
  hideToast: (id: string) => void
  clearAllToasts: () => void
}

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }) {
  const [feedback, setFeedback] = useState({ show: false, type: 'error', message: '' })
  const [modals, setModals] = useState<ModalInstance[]>([])
  const [globalLoading, setGlobalLoading] = useState(false)
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showFeedback = useCallback((type: string, message: string) => {
    setFeedback({ show: true, type, message })
  }, [])

  const hideFeedback = useCallback(() => {
    setFeedback(prev => ({ ...prev, show: false }))
  }, [])

  const openModal = useCallback((name: string, props: Record<string, unknown> = {}): string => {
    const id = `${name}-${Date.now()}`
    setModals(prev => [...prev, { id, name, props }])
    return id
  }, [])

  const closeModal = useCallback((id: string) => {
    setModals(prev => prev.filter(m => m.id !== id))
  }, [])

  const closeAllModals = useCallback(() => {
    setModals([])
  }, [])

  const isModalOpen = useCallback((name: string): boolean => {
    return modals.some(m => m.name === name)
  }, [modals])

  const getModalProps = useCallback((name: string): Record<string, unknown> | undefined => {
    const modal = modals.find(m => m.name === name)
    return modal?.props
  }, [modals])

  const showToast = useCallback((type: ToastMessage['type'], message: string, duration = 4000): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const toast: ToastMessage = { id, type, message, duration }
    setToasts(prev => [...prev, toast])
    
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    
    return id
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const value: UIContextValue = {
    feedback,
    showFeedback,
    hideFeedback,
    setFeedback,
    modals,
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    getModalProps,
    globalLoading,
    setGlobalLoading,
    toasts,
    showToast,
    hideToast,
    clearAllToasts,
  }

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI(): UIContextValue {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within UIProvider')
  }
  return context
}
