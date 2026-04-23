import { useState, useEffect } from 'react'

interface PasswordChecks {
  hasUpperCase: boolean
  hasLowerCase: boolean
  hasNumbers: boolean
  hasSpecialChar: boolean
  isLongEnough: boolean
}

interface PasswordStrength {
  valid: boolean
  score: number
  message: string
  checks?: PasswordChecks
}

interface UsePasswordStrengthReturn extends PasswordStrength {
  color: string
  width: string
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  if (!password || password.length < 6) {
    return { 
      valid: false, 
      score: 0,
      message: 'A senha deve ter pelo menos 6 caracteres' 
    }
  }
  
  let score = 0
  const checks: PasswordChecks = {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    isLongEnough: password.length >= 8
  }
  
  if (checks.hasUpperCase) score++
  if (checks.hasLowerCase) score++
  if (checks.hasNumbers) score++
  if (checks.hasSpecialChar) score++
  if (checks.isLongEnough) score++
  
  let message = ''
  let valid = false
  
  if (score <= 2) {
    message = 'Senha fraca'
    valid = true
  } else if (score === 3) {
    message = 'Senha média'
    valid = true
  } else {
    message = 'Senha forte'
    valid = true
  }
  
  return { 
    valid, 
    score, 
    message,
    checks 
  }
}

export const usePasswordStrength = (password: string): UsePasswordStrengthReturn => {
  const [strength, setStrength] = useState<PasswordStrength>({ valid: false, score: 0, message: '' })
  
  useEffect(() => {
    if (password) {
      setStrength(validatePasswordStrength(password))
    } else {
      setStrength({ valid: false, score: 0, message: '' })
    }
  }, [password])
  
  const getStrengthColor = (): string => {
    if (strength.score <= 2) return 'bg-red-500'
    if (strength.score === 3) return 'bg-yellow-500'
    return 'bg-green-500'
  }
  
  const getStrengthWidth = (): string => {
    return `${Math.min((strength.score / 4) * 100, 100)}%`
  }
  
  return {
    ...strength,
    color: getStrengthColor(),
    width: getStrengthWidth()
  }
}