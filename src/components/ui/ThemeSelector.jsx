import React, { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Clock, ChevronDown } from '../../lib/icons'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const ThemeSelector = () => {
  const { profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [themeMode, setThemeMode] = useState('manual')
  const [darkMode, setDarkMode] = useState(false)
  const [sunTimes, setSunTimes] = useState({ sunrise: '06:00', sunset: '18:00' })
  const [timeBasedTheme, setTimeBasedTheme] = useState('light')
  const [systemTheme, setSystemTheme] = useState('light')

  // Carregar preferências do perfil
  useEffect(() => {
    if (profile) {
      setThemeMode(profile.theme_mode || 'manual')
      setDarkMode(profile.dark_mode || false)
    }
  }, [profile])

  // Detectar tema do sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    mediaQuery.addEventListener('change', handleChange)
    
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Calcular tema baseado no horário
  useEffect(() => {
    const calculateTimeBasedTheme = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const currentTime = hours + minutes / 60
      
      // Horários aproximados (padrão)
      const sunrise = 6
      const sunset = 18
      
      setSunTimes({
        sunrise: `${sunrise.toString().padStart(2, '0')}:00`,
        sunset: `${sunset.toString().padStart(2, '0')}:00`
      })
      
      const isNight = currentTime < sunrise || currentTime >= sunset
      setTimeBasedTheme(isNight ? 'dark' : 'light')
    }
    
    calculateTimeBasedTheme()
    const interval = setInterval(calculateTimeBasedTheme, 60000)
    
    return () => clearInterval(interval)
  }, [])

  // Determinar tema efetivo
  const getEffectiveTheme = () => {
    if (themeMode === 'manual') {
      return darkMode ? 'dark' : 'light'
    } else if (themeMode === 'system') {
      return systemTheme
    } else {
      // 'auto' - baseado no horário
      return timeBasedTheme
    }
  }

  const effectiveTheme = getEffectiveTheme()

  // Aplicar tema no DOM
  useEffect(() => {
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [effectiveTheme])

  // Salvar preferência no banco
  const savePreference = async (mode, isDark) => {
    if (!profile?.id) return
    
    try {
      await supabase.rpc('update_user_preferences', {
        p_user_id: profile.id,
        p_dark_mode: isDark,
        p_sidebar_collapsed: null,
        p_table_density: null
      })
      
      // Também salvar theme_mode
      await supabase
        .from('profiles')
        .update({ theme_mode: mode })
        .eq('id', profile.id)
        
    } catch (error) {
      console.error('Erro ao salvar preferência:', error)
    }
  }

  const handleModeChange = (mode) => {
    setThemeMode(mode)
    
    if (mode === 'manual') {
      savePreference(mode, darkMode)
    } else if (mode === 'system') {
      savePreference(mode, systemTheme === 'dark')
    } else {
      savePreference(mode, timeBasedTheme === 'dark')
    }
  }

  const handleManualToggle = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    setThemeMode('manual')
    savePreference('manual', newDarkMode)
  }

  const getThemeIcon = () => {
    if (themeMode === 'auto') return Clock
    if (themeMode === 'system') return Monitor
    return effectiveTheme === 'dark' ? Moon : Sun
  }

  const ThemeIcon = getThemeIcon()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <ThemeIcon size={20} className="text-gray-600 dark:text-gray-300" />
        <ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-2">
            {/* Opções de modo */}
            <div className="space-y-1 mb-3">
              <button
                onClick={() => handleModeChange('auto')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  themeMode === 'auto' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Clock size={20} />
                <div className="flex-1 text-left">
                  <p className="font-medium dark:text-white">Automático (Horário)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Escuro à noite, claro de dia
                  </p>
                </div>
                {themeMode === 'auto' && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>

              <button
                onClick={() => handleModeChange('system')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  themeMode === 'system' 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <Monitor size={20} />
                <div className="flex-1 text-left">
                  <p className="font-medium dark:text-white">Seguir Sistema</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Usar preferência do dispositivo
                  </p>
                </div>
                {themeMode === 'system' && (
                  <div className="w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>
            </div>

            {/* Toggle manual */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <button
                onClick={() => {
                  handleManualToggle()
                  handleModeChange('manual')
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  themeMode === 'manual'
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {effectiveTheme === 'dark' ? (
                    <Moon size={20} className="text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Sun size={20} className="text-gray-600 dark:text-gray-300" />
                  )}
                  <span className="dark:text-white">Tema {effectiveTheme === 'dark' ? 'Escuro' : 'Claro'}</span>
                </div>
                <div className={`relative w-11 h-6 rounded-full transition-colors ${
                  effectiveTheme === 'dark' ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    effectiveTheme === 'dark' ? 'translate-x-5' : ''
                  }`} />
                </div>
              </button>
            </div>

            {/* Informações do horário (modo auto) */}
            {themeMode === 'auto' && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🌅 Nascer do sol: {sunTimes.sunrise}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🌇 Pôr do sol: {sunTimes.sunset}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tema atual: {timeBasedTheme === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
                </p>
              </div>
            )}
            
            {/* Informações do sistema (modo system) */}
            {themeMode === 'system' && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sistema: {systemTheme === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ThemeSelector