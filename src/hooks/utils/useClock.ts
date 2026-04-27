import { useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface UseClockReturn {
  currentTime: Date
  greeting: string
  formatTime: () => string
  formatDate: () => string
  refresh: () => void
  isRefreshing: boolean
  setRefreshCallback: (callback: (() => Promise<void>) | null) => void
}

export const useClock = (): UseClockReturn => {
  const queryClient = useQueryClient()
  const [currentTime, setCurrentTime] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshCallback, setRefreshCallback] = useState<(() => Promise<void>) | null>(null)

  const updateTime = useCallback(() => {
    setCurrentTime(new Date())
  }, [])

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    
    // Atualiza o relógio
    updateTime()
    
    // Executa o callback de refresh se existir
    if (refreshCallback) {
      try {
        await refreshCallback()
      } catch (error) {
        console.error('Erro ao fazer refresh:', error)
      }
    }
    
    // Invalidar todas as queries do dashboard
    await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    await queryClient.invalidateQueries({ queryKey: ['sales'] })
    await queryClient.invalidateQueries({ queryKey: ['products'] })
    await queryClient.invalidateQueries({ queryKey: ['budgets'] })
    await queryClient.invalidateQueries({ queryKey: ['customers'] })
    await queryClient.invalidateQueries({ queryKey: ['top-sellers'] })
    
    setTimeout(() => setIsRefreshing(false), 500)
  }, [updateTime, refreshCallback, queryClient])

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
    refresh,
    isRefreshing,
    setRefreshCallback
  }
}