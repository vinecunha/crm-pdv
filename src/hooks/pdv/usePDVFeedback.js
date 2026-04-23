// src/hooks/pdv/usePDVFeedback.js
import { useState, useCallback } from 'react'

export const usePDVFeedback = () => {
  const [feedback, setFeedback] = useState({ 
    show: false, 
    type: 'success', 
    message: '' 
  })
  const [shortcutFeedback, setShortcutFeedback] = useState(null)

  const showFeedback = useCallback((type, message) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }, [])

  const hideFeedback = useCallback(() => {
    setFeedback({ show: false, type: 'success', message: '' })
  }, [])

  const showShortcutFeedback = useCallback((shortcut) => {
    setShortcutFeedback(shortcut)
  }, [])

  const hideShortcutFeedback = useCallback(() => {
    setShortcutFeedback(null)
  }, [])

  return {
    feedback,
    shortcutFeedback,
    showFeedback,
    hideFeedback,
    showShortcutFeedback,
    hideShortcutFeedback
  }
}
