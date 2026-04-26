import { useState, useEffect } from 'react'
import { logger } from '@utils/logger'

interface NetworkStatus {
  isOnline: boolean
  wasOffline: boolean
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)
  const [wasOffline, setWasOffline] = useState<boolean>(false)

  useEffect(() => {
    const handleOnline = () => {
      logger.log('🌐 Conexão restaurada!')
      setIsOnline(true)
      
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register('sync-pending-sales')
            .then(() => logger.log('🔄 Sincronização registrada'))
            .catch((err: Error) => logger.error('Erro ao registrar sync:', err))
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