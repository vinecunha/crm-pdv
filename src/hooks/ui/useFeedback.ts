import { useState, useCallback } from 'react'

type FeedbackType = 'success' | 'error' | 'warning' | 'info'

interface FeedbackState {
  message: string | null
  type: FeedbackType
}

interface UseFeedbackReturn {
  feedback: FeedbackState
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
  clearFeedback: () => void
}

const useFeedback = (): UseFeedbackReturn => {
  const [feedback, setFeedback] = useState<FeedbackState>({
    message: null,
    type: 'success'
  })

  const showSuccess = useCallback((message: string) => {
    setFeedback({ message, type: 'success' })
  }, [])

  const showError = useCallback((message: string) => {
    setFeedback({ message, type: 'error' })
  }, [])

  const showWarning = useCallback((message: string) => {
    setFeedback({ message, type: 'warning' })
  }, [])

  const showInfo = useCallback((message: string) => {
    setFeedback({ message, type: 'info' })
  }, [])

  const clearFeedback = useCallback(() => {
    setFeedback({ message: null, type: 'success' })
  }, [])

  return {
    feedback,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearFeedback
  }
}

export default useFeedback