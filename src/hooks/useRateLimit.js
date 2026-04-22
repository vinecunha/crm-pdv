// src/hooks/useRateLimit.js
import { useState, useCallback } from 'react'
import { supabase } from '@lib/supabase'

export const useRateLimit = () => {
  const [isBlocked, setIsBlocked] = useState(false)
  const [remainingAttempts, setRemainingAttempts] = useState(5)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(false)

  const checkRateLimit = useCallback(async (email) => {
    if (!email) return

    try {
      const { data, error } = await supabase.functions.invoke('rate-limit', {
        body: { action: 'check', identifier: email.toLowerCase().trim() }
      })

      if (error) throw error

      setIsBlocked(data.isBlocked)
      setRemainingAttempts(data.remainingAttempts)
      setTimeRemaining(data.timeRemaining)
      
      return data
    } catch (error) {
      console.error('Erro ao verificar rate limit:', error)
    }
  }, [])

  const recordAttempt = useCallback(async (success, email) => {
    if (!email) return

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('rate-limit', {
        body: { 
          action: 'record', 
          identifier: email.toLowerCase().trim(), 
          success 
        }
      })

      if (error) throw error

      if (success) {
        setIsBlocked(false)
        setRemainingAttempts(5)
        setTimeRemaining(0)
      } else {
        setIsBlocked(data.isBlocked)
        setRemainingAttempts(data.remainingAttempts)
      }

      return data
    } catch (error) {
      console.error('Erro ao registrar tentativa:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    isBlocked,
    remainingAttempts,
    timeRemaining,
    loading,
    checkRateLimit,
    recordAttempt
  }
}