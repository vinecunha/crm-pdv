// src/hooks/useWelcomeMessage.ts
import { useMemo } from 'react'
import { useAuth } from '@contexts/AuthContext'

interface WelcomeMessage {
  greeting: string
  roleEmoji: string
  roleLabel: string
  timeBasedGreeting: string
  fullWelcome: string
}

export function useWelcomeMessage(): WelcomeMessage {
  const { profile } = useAuth()

  return useMemo(() => {
    const firstName = profile?.full_name?.split(' ')[0] || 'Usuário'
    
    // Emoji e label por role
    const roleConfig = {
      admin: { emoji: '👑', label: 'Administrador' },
      gerente: { emoji: '📊', label: 'Gerente' },
      operador: { emoji: '💼', label: 'Operador' },
      default: { emoji: '👤', label: 'Usuário' }
    }
    
    const role = profile?.role || 'default'
    const { emoji, label } = roleConfig[role as keyof typeof roleConfig] || roleConfig.default
    
    // Saudação baseada na hora
    const hour = new Date().getHours()
    let timeBasedGreeting: string
    
    if (hour < 5) timeBasedGreeting = 'Boa madrugada'
    else if (hour < 12) timeBasedGreeting = 'Bom dia'
    else if (hour < 18) timeBasedGreeting = 'Boa tarde'
    else timeBasedGreeting = 'Boa noite'
    
    return {
      greeting: `${timeBasedGreeting}, ${firstName}!`,
      roleEmoji: emoji,
      roleLabel: label,
      timeBasedGreeting,
      fullWelcome: `${emoji} ${timeBasedGreeting}, ${firstName}!`
    }
  }, [profile?.full_name, profile?.role])
}