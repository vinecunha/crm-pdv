import { useState, useEffect } from 'react'
import { secureStorage } from '../utils/secureStorage'

const LOGIN_ATTEMPTS_KEY = 'login_attempts'

export const useRateLimit = (maxAttempts = 5, windowMs = 900000) => { // 15 minutos
  const [attempts, setAttempts] = useState(0)
  const [blockedUntil, setBlockedUntil] = useState(null)
  
  useEffect(() => {
    const stored = secureStorage.get(LOGIN_ATTEMPTS_KEY)
    if (stored) {
      if (Date.now() < stored.blockedUntil) {
        setBlockedUntil(stored.blockedUntil)
        setAttempts(stored.attempts)
      } else {
        secureStorage.remove(LOGIN_ATTEMPTS_KEY)
      }
    }
  }, [])
  
  const recordAttempt = (success) => {
    if (success) {
      secureStorage.remove(LOGIN_ATTEMPTS_KEY)
      setAttempts(0)
      setBlockedUntil(null)
      return
    }
    
    const newAttempts = attempts + 1
    setAttempts(newAttempts)
    
    if (newAttempts >= maxAttempts) {
      const blockedUntil = Date.now() + windowMs
      setBlockedUntil(blockedUntil)
      secureStorage.set(LOGIN_ATTEMPTS_KEY, {
        attempts: newAttempts,
        blockedUntil
      })
    } else {
      secureStorage.set(LOGIN_ATTEMPTS_KEY, {
        attempts: newAttempts,
        blockedUntil: null
      })
    }
  }
  
  const isBlocked = blockedUntil && Date.now() < blockedUntil
  const remainingAttempts = maxAttempts - attempts
  const timeRemaining = blockedUntil ? Math.ceil((blockedUntil - Date.now()) / 60000) : 0
  
  const resetAttempts = () => {
    secureStorage.remove(LOGIN_ATTEMPTS_KEY)
    setAttempts(0)
    setBlockedUntil(null)
  }
  
  return {
    isBlocked,
    remainingAttempts,
    timeRemaining,
    recordAttempt,
    resetAttempts
  }
}