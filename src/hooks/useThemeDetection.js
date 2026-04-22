import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@contexts/AuthContext'

// Coordenadas padrão (São Paulo)
const DEFAULT_COORDS = { latitude: -23.5505, longitude: -46.6333 }

export const useThemeDetection = () => {
  const { profile } = useAuth()
  const [systemTheme, setSystemTheme] = useState('light')
  const [timeBasedTheme, setTimeBasedTheme] = useState('light')
  const [userTheme, setUserTheme] = useState(null)
  const [sunTimes, setSunTimes] = useState({ sunrise: '06:00', sunset: '18:00' })
  const [location, setLocation] = useState(DEFAULT_COORDS)

  // 1. Detectar tema do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 2. Obter localização do usuário
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        console.warn('Erro ao obter localização:', error.message)
        // Usar coordenadas padrão
      }
    )
  }, [])

  // 3. Calcular nascer/pôr do sol
  const calculateSunTimes = useCallback((date = new Date()) => {
    const { latitude, longitude } = location
    
    // Algoritmo simplificado (aproximado)
    const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)
    
    // Cálculo aproximado do nascer do sol
    const sunriseHour = 6 + Math.sin((dayOfYear - 80) * 0.017) * 1.5
    const sunsetHour = 18 - Math.sin((dayOfYear - 80) * 0.017) * 1.5
    
    const formatTime = (hour) => {
      const h = Math.floor(hour)
      const m = Math.floor((hour - h) * 60)
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }
    
    setSunTimes({
      sunrise: formatTime(sunriseHour),
      sunset: formatTime(sunsetHour)
    })
    
    // Verificar se é noite ou dia
    const currentHour = date.getHours() + date.getMinutes() / 60
    const isNight = currentHour < sunriseHour || currentHour >= sunsetHour
    
    setTimeBasedTheme(isNight ? 'dark' : 'light')
  }, [location])

  // 4. Carregar tema do usuário do perfil
  useEffect(() => {
    if (profile?.dark_mode !== undefined) {
      setUserTheme(profile.dark_mode ? 'dark' : 'light')
    }
  }, [profile?.dark_mode])

  // 5. Inicializar geolocalização e calcular horários
  useEffect(() => {
    getLocation()
  }, [getLocation])

  useEffect(() => {
    if (location) {
      calculateSunTimes()
      
      // Atualizar a cada minuto
      const interval = setInterval(() => calculateSunTimes(), 60000)
      return () => clearInterval(interval)
    }
  }, [location, calculateSunTimes])

  // 6. Determinar tema final com prioridade
  const getEffectiveTheme = useCallback((mode = 'auto') => {
    // Se o usuário escolheu manualmente, usar a escolha dele
    if (userTheme) return userTheme
    
    // Se modo automático está desativado, usar sistema
    if (mode === 'system') return systemTheme
    
    // Modo automático: usar horário do dia
    return timeBasedTheme
  }, [userTheme, systemTheme, timeBasedTheme])

  return {
    systemTheme,
    timeBasedTheme,
    userTheme,
    sunTimes,
    location,
    getEffectiveTheme,
    refreshLocation: getLocation
  }
}