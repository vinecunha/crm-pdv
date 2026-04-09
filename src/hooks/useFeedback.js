import { useState, useCallback } from 'react'

const useFeedback = () => {
  const [feedback, setFeedback] = useState({
    message: null,
    type: 'success'
  })

  const showSuccess = useCallback((message) => {
    setFeedback({ message, type: 'success' })
  }, [])

  const showError = useCallback((message) => {
    setFeedback({ message, type: 'error' })
  }, [])

  const showWarning = useCallback((message) => {
    setFeedback({ message, type: 'warning' })
  }, [])

  const showInfo = useCallback((message) => {
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