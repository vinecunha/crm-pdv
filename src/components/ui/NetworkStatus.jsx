import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, RefreshCw, X } from 'lucide-react'
import { useNetworkStatus } from '../../hooks/useNetworkStatus'
import { getPendingSalesCount } from '../../utils/offlineStorage'

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
    const interval = setInterval(checkPending, 10000) // A cada 10 segundos
    
    return () => clearInterval(interval)
  }, [])

  // Quando voltar online, verificar pendências
  useEffect(() => {
    if (isOnline) {
      getPendingSalesCount().then(setPendingCount)
    }
  }, [isOnline])

  // Se estiver online e sem pendências, não mostrar nada
  if (isOnline && pendingCount === 0) return null

  return (
    <>
      {/* Indicador fixo no canto inferior esquerdo */}
      <div 
        className="fixed bottom-4 left-4 z-50 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all
          ${isOnline 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-yellow-500 hover:bg-yellow-600'
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

      {/* Modal de detalhes */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDetails(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                {isOnline ? 'Sincronização em andamento' : 'Modo Offline'}
              </h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`p-3 rounded-full ${isOnline ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                  {isOnline 
                    ? <Wifi size={24} className="text-blue-600" />
                    : <WifiOff size={24} className="text-yellow-600" />
                  }
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {isOnline ? 'Conectado à internet' : 'Sem conexão com internet'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isOnline 
                      ? 'Sincronizando vendas pendentes...'
                      : 'As vendas serão salvas localmente'
                    }
                  </p>
                </div>
              </div>

              {pendingCount > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Vendas pendentes de sincronização
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isOnline 
                      ? 'Enviando para o servidor...'
                      : 'Serão sincronizadas quando a internet voltar'
                    }
                  </p>
                </div>
              )}

              {pendingCount === 0 && isOnline && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-700">
                    ✅ Todas as vendas foram sincronizadas!
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
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

// Componente Button simples (se não tiver o import)
const Button = ({ variant = 'primary', onClick, children }) => {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
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

export default NetworkStatus