import { useState, useCallback } from 'react'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

interface RateLimitData {
  isBlocked: boolean
  remainingAttempts: number
  timeRemaining: number
}

interface UseRateLimitReturn extends RateLimitData {
  loading: boolean
  checkRateLimit: (email: string) => Promise<RateLimitData | undefined>
  recordAttempt: (success: boolean, email: string) => Promise<RateLimitData | undefined>
}

export const useRateLimit = (): UseRateLimitReturn => {
  const [isBlocked, setIsBlocked] = useState<boolean>(false)
  const [remainingAttempts, setRemainingAttempts] = useState<number>(5)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  const checkRateLimit = useCallback(async (email: string): Promise<RateLimitData | undefined> => {
    if (!email) return
    
    try {
      // TEMPORÁRIO: Pular verificação de rate limit se houver erro CORS
      const { data, error } = await supabase.functions.invoke<RateLimitData>('rate-limit', {
        body: { action: 'check', identifier: email.toLowerCase().trim() }
      })
      
      if (error) {
        logger.warn('Rate limit check failed (CORS?), allowing login:', error.message)
        // Retornar valores padrão para permitir login
        return { isBlocked: false, remainingAttempts: 5, timeRemaining: 0 }
      }
      
      setIsBlocked(data.isBlocked)
      setRemainingAttempts(data.remainingAttempts)
      setTimeRemaining(data.timeRemaining)
      
      return data
    } catch (error: any) {
      logger.error('Erro ao verificar rate limit:', error)
      // Em caso de erro, permitir login
      return { isBlocked: false, remainingAttempts: 5, timeRemaining: 0 }
    }
  }, [])

  const recordAttempt = useCallback(async (success: boolean, email: string): Promise<RateLimitData | undefined> => {
    if (!email) return

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke<RateLimitData>('rate-limit', {
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
      logger.error('Erro ao registrar tentativa:', error)
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