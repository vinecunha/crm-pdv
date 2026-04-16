import React, { createContext, useContext, useState, useEffect } from 'react'
import logger from '../utils/logger'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    if (stored) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const html = document.documentElement
    
    logger.log('🎨 [Theme] Tema alterado', { theme: isDark ? 'dark' : 'light' })
    
    // ✅ Apenas adiciona/remove a classe 'dark'
    if (isDark) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const toggleTheme = () => {
    logger.log('🔄 [Theme] Alternando tema', { 
      from: isDark ? 'dark' : 'light', 
      to: !isDark ? 'dark' : 'light' 
    })
    setIsDark(prev => !prev)
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}