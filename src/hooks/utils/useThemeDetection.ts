import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@contexts/AuthContext'

interface Coordinates {
  latitude: number
  longitude: number
}

interface SunTimes {
  sunrise: string
  sunset: string
}

type Theme = 'light' | 'dark'
type ThemeMode = 'auto' | 'system'

const DEFAULT_COORDS: Coordinates = { latitude: -23.5505, longitude: -46.6333 }

export const useThemeDetection = () => {
  const { profile } = useAuth()
  const [systemTheme, setSystemTheme] = useState<Theme>('light')
  const [timeBasedTheme, setTimeBasedTheme] = useState<Theme>('light')
  const [userTheme, setUserTheme] = useState<Theme | null>(null)
  const [sunTimes, setSunTimes] = useState<SunTimes>({ sunrise: '06:00', sunset: '18:00' })
  const [location, setLocation] = useState<Coordinates>(DEFAULT_COORDS)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) return
    
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error: GeolocationPositionError) => {
        console.warn('Erro ao obter localização:', error.message)
      }
    )
  }, [])

  const calculateSunTimes = useCallback((date: Date = new Date()) => {
    const { latitude, longitude } = location
    
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
    
    const sunriseHour = 6 + Math.sin((dayOfYear - 80) * 0.017) * 1.5
    const sunsetHour = 18 - Math.sin((dayOfYear - 80) * 0.017) * 1.5
    
    const formatTime = (hour: number): string => {
      const h = Math.floor(hour)
      const m = Math.floor((hour - h) * 60)
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
    }
    
    setSunTimes({
      sunrise: formatTime(sunriseHour),
      sunset: formatTime(sunsetHour)
    })
    
    const currentHour = date.getHours() + date.getMinutes() / 60
    const isNight = currentHour < sunriseHour || currentHour >= sunsetHour
    
    setTimeBasedTheme(isNight ? 'dark' : 'light')
  }, [location])

  useEffect(() => {
    if (profile?.dark_mode !== undefined) {
      setUserTheme(profile.dark_mode ? 'dark' : 'light')
    }
  }, [profile?.dark_mode])

  useEffect(() => {
    getLocation()
  }, [getLocation])

  useEffect(() => {
    if (location) {
      calculateSunTimes()
      
      const interval = setInterval(() => calculateSunTimes(), 60000)
      return () => clearInterval(interval)
    }
  }, [location, calculateSunTimes])

  const getEffectiveTheme = useCallback((mode: ThemeMode = 'auto'): Theme => {
    if (userTheme) return userTheme
    
    if (mode === 'system') return systemTheme
    
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