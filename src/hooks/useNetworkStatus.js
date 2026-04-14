import { useState, useEffect } from 'react'
import { logger } from '../utils/logger' 

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      logger.log('🌐 Conexão restaurada!')
      setIsOnline(true)
      
      // Tentar sincronizar dados pendentes
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register('sync-pending-sales')
            .then(() => logger.log('🔄 Sincronização registrada'))
            .catch(err => console.error('Erro ao registrar sync:', err))
        })
      }
    }

    const handleOffline = () => {
      logger.log('📴 Conexão perdida - modo offline ativado')
      setIsOnline(false)
      setWasOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, wasOffline }
}