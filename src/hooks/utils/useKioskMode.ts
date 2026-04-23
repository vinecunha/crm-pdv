import { useState, useCallback, useEffect } from 'react'

interface UseKioskModeReturn {
  isKioskMode: boolean
  toggleKioskMode: () => Promise<void>
}

const useKioskMode = (): UseKioskModeReturn => {
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false)
  
  const toggleKioskMode = useCallback(async (): Promise<void> => {
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