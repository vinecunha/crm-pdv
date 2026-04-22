import { useEffect } from 'react'
import { useAuth } from '@contexts/AuthContext'

const ThemeInitializer = () => {
  const { profile } = useAuth()

  useEffect(() => {
    // Aplicar tema baseado na preferência do usuário
    const darkMode = profile?.dark_mode ?? false
    
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [profile?.dark_mode])

  return null
}

export default ThemeInitializer