import React, { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { useThemeDetection } from '@/hooks/utils/useThemeDetection'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const { profile } = useAuth()
  const { systemTheme, timeBasedTheme, sunTimes, getEffectiveTheme } = useThemeDetection()
  
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('themeMode') || 'auto' // 'auto', 'system', 'manual'
  })
  
  const [manualTheme, setManualTheme] = useState(() => {
    return localStorage.getItem('manualTheme') || 'light'
  })

  // Aplicar tema no DOM - uses centralized logic from useThemeDetection
  useEffect(() => {
    const effectiveTheme = getEffectiveTheme(themeMode)
    
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // Salvar preferência no localStorage como cache
    localStorage.setItem('effectiveTheme', effectiveTheme)
  }, [themeMode, getEffectiveTheme])

  const value = {
    themeMode,
    setThemeMode,
    manualTheme,
    setManualTheme,
    systemTheme,
    timeBasedTheme,
    sunTimes,
    currentTheme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
