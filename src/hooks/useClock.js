// hooks/useClock.js
import { useState, useEffect, useCallback } from 'react'

export const useClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  const updateTime = useCallback(() => {
    setCurrentTime(new Date())
  }, [])

  // Refresh manual
  const refresh = useCallback(() => {
    updateTime()
  }, [updateTime])

  useEffect(() => {
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [updateTime])

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const formatTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = () => {
    return currentTime.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return {
    currentTime,
    greeting: getGreeting(),
    formatTime,
    formatDate,
    refresh  // <-- Adicionado refresh
  }
}