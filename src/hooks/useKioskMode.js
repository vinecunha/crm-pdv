import { useState, useCallback, useEffect } from 'react'

const useKioskMode = () => {
  const [isKioskMode, setIsKioskMode] = useState(false)
  
  const toggleKioskMode = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsKioskMode(true)
        document.body.classList.add('kiosk-mode')
      } else {
        await document.exitFullscreen()
        setIsKioskMode(false)
        document.body.classList.remove('kiosk-mode')
      }
    } catch (error) {
      console.error('Erro ao alternar modo quiosque:', error)
    }
  }, [])
  
  // Detectar saída do fullscreen por ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      setIsKioskMode(isFullscreen)
      if (!isFullscreen) {
        document.body.classList.remove('kiosk-mode')
      }
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])
  
  return { 
    isKioskMode, 
    toggleKioskMode
  }
}

export default useKioskMode