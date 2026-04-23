import { useState, useEffect, useCallback } from 'react'

interface UseClockReturn {
  currentTime: Date
  greeting: string
  formatTime: () => string
  formatDate: () => string
  refresh: () => void
}

export const useClock = (): UseClockReturn => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  const updateTime = useCallback(() => {
    setCurrentTime(new Date())
  }, [])

  const refresh = useCallback(() => {
    updateTime()
  }, [updateTime])

  useEffect(() => {
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [updateTime])

  const getGreeting = (): string => {
    const hour = currentTime.getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  const formatTime = (): string => {
    return currentTime.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (): string => {
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
    refresh
  }
}