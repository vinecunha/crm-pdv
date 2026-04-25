import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, X } from '@lib/icons'
import { useNetworkStatus } from '@/hooks/utils/useNetworkStatus'
import { getPendingSalesCount } from '@utils/offlineStorage'

const Button = ({ variant = 'primary', onClick, children }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
  }
  
  return (
    <button 
      onClick={onClick}
      className={`px-4 py-2 rounded-lg transition-colors ${variants[variant]}`}
    >
      {children}
    </button>
  )
}

const NetworkStatus = () => {
  const { isOnline } = useNetworkStatus()
  const [pendingCount, setPendingCount] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const checkPending = async () => {
      const count = await getPendingSalesCount()
      setPendingCount(count)
    }
    
    checkPending()
    const interval = setInterval(checkPending, 10000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isOnline) {
      getPendingSalesCount().then(setPendingCount)
    }
  }, [isOnline])

  if (isOnline && pendingCount === 0) return null

  return (
    <>
      <div 
        className="fixed bottom-4 left-4 z-50 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all
          ${isOnline 
            ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700' 
            : 'bg-yellow-500 hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700'
          } text-white
        `}>
          {isOnline ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              <span className="text-sm font-medium">
                Sincronizando {pendingCount} {pendingCount === 1 ? 'venda' : 'vendas'}
              </span>
            </>
          ) : (
            <>
              <WifiOff size={16} />
              <span className="text-sm font-medium">Modo Offline</span>
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                  {pendingCount}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 dark:bg-black/50" onClick={() => setShowDetails(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold dark:text-white">
                {isOnline ? 'Sincronização em andamento' : 'Modo Offline'}
              </h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${isOnline ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                  {isOnline 
                    ? <Wifi size={24} className="text-blue-600 dark:text-blue-400" />
                    : <WifiOff size={24} className="text-yellow-600 dark:text-yellow-400" />
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {isOnline ? 'Conectado à internet' : 'Sem conexão com internet'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isOnline 
                      ? 'Sincronizando vendas pendentes...'
                      : 'As vendas serão salvas localmente'
                    }
                  </p>
                </div>
              </div>

              {pendingCount > 0 && (
                <div className="bg-gray-50 dark:bg-black/50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vendas pendentes de sincronização
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isOnline 
                      ? 'Enviando para o servidor...'
                      : 'Serão sincronizadas quando a internet voltar'
                    }
                  </p>
                </div>
              )}

              {pendingCount === 0 && isOnline && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✅ Todas as vendas foram sincronizadas!
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end">
              <Button variant="outline" onClick={() => setShowDetails(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NetworkStatus
