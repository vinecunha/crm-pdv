// src/components/ui/ThemeSelector.tsx
import React, { useState, useEffect, useCallback } from 'react'
import { Moon, Sun, Monitor, Clock, ChevronDown, Check } from '@lib/icons'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { logger } from '@utils/logger'

// Tipos
type ThemeMode = 'manual' | 'system' | 'auto'
type Theme = 'light' | 'dark'

interface SunTimes {
  sunrise: string
  sunset: string
}

interface ThemeOption {
  mode: ThemeMode
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  description: string
}

// Opções de tema
const THEME_OPTIONS: ThemeOption[] = [
  {
    mode: 'auto',
    icon: Clock,
    label: 'Automático (Horário)',
    description: 'Escuro à noite, claro de dia'
  },
  {
    mode: 'system',
    icon: Monitor,
    label: 'Seguir Sistema',
    description: 'Usar preferência do dispositivo'
  }
]

const ThemeSelector: React.FC = () => {
  const { profile } = useAuth()
  
  // Estado local
  const [isOpen, setIsOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>('manual')
  const [darkMode, setDarkMode] = useState(false)
  const [sunTimes, setSunTimes] = useState<SunTimes>({ sunrise: '06:00', sunset: '18:00' })
  const [timeBasedTheme, setTimeBasedTheme] = useState<Theme>('light')
  const [systemTheme, setSystemTheme] = useState<Theme>('light')

  // =============================================
  // Efeitos - Carregar preferências
  // =============================================
  useEffect(() => {
    if (profile) {
      setThemeMode((profile.theme_mode as ThemeMode) || 'manual')
      setDarkMode(profile.dark_mode || false)
    }
  }, [profile])

  // =============================================
  // Efeitos - Detectar tema do sistema
  // =============================================
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    // Valor inicial
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    
    // Listener
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // =============================================
  // Efeitos - Calcular tema baseado no horário
  // =============================================
  useEffect(() => {
    const calculateTimeBasedTheme = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const currentTime = hours + minutes / 60
      
      // Horários padrão
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

  // =============================================
  // Tema efetivo
  // =============================================
  const getEffectiveTheme = useCallback((): Theme => {
    switch (themeMode) {
      case 'manual':
        return darkMode ? 'dark' : 'light'
      case 'system':
        return systemTheme
      case 'auto':
        return timeBasedTheme
      default:
        return 'light'
    }
  }, [themeMode, darkMode, systemTheme, timeBasedTheme])

  const effectiveTheme = getEffectiveTheme()

  // =============================================
  // Aplicar tema no DOM
  // =============================================
  useEffect(() => {
    const root = document.documentElement
    
    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Atualizar meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        effectiveTheme === 'dark' ? '#0f172a' : '#ffffff'
      )
    }
  }, [effectiveTheme])

  // =============================================
  // Salvar preferência no banco
  // =============================================
  const savePreference = useCallback(async (mode: ThemeMode, isDark: boolean) => {
    if (!profile?.id) return
    
    try {
      // Salvar modo
      await supabase
        .from('profiles')
        .update({ 
          theme_mode: mode,
          dark_mode: isDark 
        })
        .eq('id', profile.id)
        
    } catch (error) {
      logger.error('Erro ao salvar tema:', error)
    }
  }, [profile?.id])

  // =============================================
  // Handlers
  // =============================================
  const handleModeChange = useCallback((mode: ThemeMode) => {
    setThemeMode(mode)
    setIsOpen(false)
    
    let isDark: boolean
    switch (mode) {
      case 'manual':
        isDark = darkMode
        break
      case 'system':
        isDark = systemTheme === 'dark'
        break
      case 'auto':
        isDark = timeBasedTheme === 'dark'
        break
    }
    
    savePreference(mode, isDark)
  }, [darkMode, systemTheme, timeBasedTheme, savePreference])

  const handleManualToggle = useCallback(() => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    setThemeMode('manual')
    savePreference('manual', newDarkMode)
  }, [darkMode, savePreference])

  // =============================================
  // Ícone do botão principal
  // =============================================
  const getThemeIcon = useCallback((): React.ComponentType<{ size?: number; className?: string }> => {
    if (themeMode === 'auto') return Clock
    if (themeMode === 'system') return Monitor
    return effectiveTheme === 'dark' ? Moon : Sun
  }, [themeMode, effectiveTheme])

  const ThemeIcon = getThemeIcon()

  // =============================================
  // Render
  // =============================================
  return (
    <div className="relative">
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 p-1.5 sm:p-2 rounded-lg 
          text-gray-600 dark:text-gray-300
          hover:bg-gray-100 dark:hover:bg-gray-800 
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
          dark:focus:ring-offset-gray-900"
        aria-label={`Tema atual: ${effectiveTheme === 'dark' ? 'Escuro' : 'Claro'}`}
        title={`Tema: ${themeMode === 'auto' ? 'Automático' : themeMode === 'system' ? 'Sistema' : 'Manual'}`}
      >
        <ThemeIcon size={16} className="sm:w-[18px] sm:h-[18px]" />
        <ChevronDown 
          size={12} 
          className={`text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para fechar */}
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Painel */}
          <div className="absolute right-0 mt-2 w-72 sm:w-80 
            bg-white dark:bg-gray-900 
            rounded-xl shadow-2xl 
            border border-gray-200 dark:border-gray-700 
            z-[100] p-2
            animate-in slide-in-from-top-2 duration-200">
            
            {/* Cabeçalho */}
            <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Aparência
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Escolha como o sistema aparece
              </p>
            </div>

            {/* Modo Manual - Toggle rápido */}
            <div className="px-1 mb-2">
              <button
                onClick={handleManualToggle}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                  themeMode === 'manual'
                    ? 'bg-blue-50 dark:bg-blue-900/30'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  {effectiveTheme === 'dark' ? (
                    <Moon size={20} className="text-gray-600 dark:text-gray-300" />
                  ) : (
                    <Sun size={20} className="text-gray-600 dark:text-gray-300" />
                  )}
                  <span className="text-sm font-medium dark:text-white">
                    Modo {effectiveTheme === 'dark' ? 'Escuro' : 'Claro'}
                  </span>
                </div>
                
                {/* Toggle Switch */}
                <div 
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                    effectiveTheme === 'dark' 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  role="switch"
                  aria-checked={effectiveTheme === 'dark'}
                >
                  <span 
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow 
                      transition-transform duration-200 ${
                      effectiveTheme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                    }`} 
                  />
                </div>
              </button>
            </div>

            {/* Divisor */}
            <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

            {/* Opções de modo automático */}
            <div className="space-y-1">
              {THEME_OPTIONS.map((option) => {
                const Icon = option.icon
                const isSelected = themeMode === option.mode
                
                return (
                  <button
                    key={option.mode}
                    onClick={() => handleModeChange(option.mode)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isSelected 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon size={20} />
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {option.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Informações adicionais */}
            <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {themeMode === 'auto' && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    🌅 Nascer do sol: {sunTimes.sunrise}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    🌇 Pôr do sol: {sunTimes.sunset}
                  </p>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1">
                    Tema atual: {timeBasedTheme === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
                  </p>
                </>
              )}
              
              {themeMode === 'system' && (
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Sistema: {systemTheme === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
                </p>
              )}
              
              {themeMode === 'manual' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Você está no controle manual do tema
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ThemeSelector