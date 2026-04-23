import { useState, useCallback } from 'react'

type FeedbackType = 'success' | 'error' | 'info' | 'warning'

interface FeedbackState {
  show: boolean
  type: FeedbackType
  message: string
}

interface ShortcutInfo {
  key: string
  description: string
  [key: string]: unknown
}

interface UsePDVFeedbackReturn {
  feedback: FeedbackState
  shortcutFeedback: ShortcutInfo | null
  showFeedback: (type: FeedbackType, message: string) => void
  hideFeedback: () => void
  showShortcutFeedback: (shortcut: ShortcutInfo) => void
  hideShortcutFeedback: () => void
}

export const usePDVFeedback = (): UsePDVFeedbackReturn => {
  const [feedback, setFeedback] = useState<FeedbackState>({ 
    show: false, 
    type: 'success', 
    message: '' 
  })
  const [shortcutFeedback, setShortcutFeedback] = useState<ShortcutInfo | null>(null)

  const showFeedback = useCallback((type: FeedbackType, message: string) => {
    setFeedback({ show: true, type, message })
    setTimeout(() => setFeedback({ show: false, type: 'success', message: '' }), 3000)
  }, [])

  const hideFeedback = useCallback(() => {
    setFeedback({ show: false, type: 'success', message: '' })
  }, [])

  const showShortcutFeedback = useCallback((shortcut: ShortcutInfo) => {
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