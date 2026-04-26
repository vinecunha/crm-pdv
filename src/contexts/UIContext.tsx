import { createContext, useContext, useState, useCallback } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [feedback, setFeedback] = useState({ show: false, type: 'error', message: '' })

  const showFeedback = useCallback((type, message) => {
    setFeedback({ show: true, type, message })
  }, [])

  const hideFeedback = useCallback(() => {
    setFeedback(prev => ({ ...prev, show: false }))
  }, [])

  return (
    <UIContext.Provider value={{ feedback, showFeedback, hideFeedback, setFeedback }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error('useUI must be used within UIProvider')
  }
  return context
}