// src/components/sales/pdv/PendingSalesIndicator.jsx
import React, { useState } from 'react'
import { CloudOff, RefreshCw, CheckCircle, AlertCircle, X } from '@lib/icons'
import { useNetworkStatus } from '@hooks/useNetworkStatus'
import useOfflineSync from '@hooks/useOfflineSync'

const PendingSalesIndicator = () => {
  const { isOnline } = useNetworkStatus()
  const { 
    pendingCount, 
    isSyncing, 
    lastSync, 
    syncProgress, 
    syncNow,
    clearFailedSales 
  } = useOfflineSync()
  
  const [showDetails, setShowDetails] = useState(false)
  
  if (pendingCount === 0 && !isSyncing) return null
  
  const hasFailures = lastSync?.failed > 0
  
  return (
    <>
      <div className="fixed bottom-20 left-4 z-50">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all
            ${isSyncing 
              ? 'bg-blue-500 dark:bg-blue-600' 
              : isOnline 
                ? 'bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-700' 
                : 'bg-orange-500 dark:bg-orange-600'
            } text-white
          `}
        >
          {isSyncing ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : isOnline ? (
            <RefreshCw size={16} />
          ) : (
            <CloudOff size={16} />
          )}
          
          <span className="text-sm font-medium">
            {isSyncing 
              ? syncProgress 
                ? `Sincronizando ${syncProgress.current}/${syncProgress.total}...`
                : 'Sincronizando...'
              : `${pendingCount} ${pendingCount === 1 ? 'venda pendente' : 'vendas pendentes'}`
            }
          </span>
          
          {hasFailures && (
            <AlertCircle size={14} className="text-yellow-200" />
          )}
        </button>
      </div>
      
      {/* Painel de Detalhes */}
      {showDetails && (
        <div className="fixed bottom-36 left-4 z-50 w-80 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">
              Vendas Offline
            </h3>
            <button
              onClick={() => setShowDetails(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="p-4 space-y-3">
            {/* Status da Rede */}
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-orange-500'}`} />
              <span className="text-gray-700 dark:text-gray-300">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Vendas Pendentes */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Vendas pendentes:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {pendingCount}
              </span>
            </div>
            
            {/* Última Sincronização */}
            {lastSync && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Última sincronização: {lastSync.timestamp.toLocaleTimeString('pt-BR')}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle size={12} />
                    Sincronizadas:
                  </span>
                  <span className="font-medium">{lastSync.synced}</span>
                </div>
                {lastSync.failed > 0 && (
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <AlertCircle size={12} />
                      Falhas:
                    </span>
                    <span className="font-medium">{lastSync.failed}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Ações */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
              <button
                onClick={() => {
                  syncNow()
                  setShowDetails(false)
                }}
                disabled={isSyncing || !isOnline}
                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </button>
              
              {hasFailures && (
                <button
                  onClick={async () => {
                    const count = await clearFailedSales()
                    if (count > 0) {
                      setShowDetails(false)
                    }
                  }}
                  className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Limpar Falhas
                </button>
              )}
            </div>
            
            {!isOnline && pendingCount > 0 && (
              <p className="text-xs text-orange-600 dark:text-orange-400">
                As vendas serão sincronizadas automaticamente quando a conexão for restaurada.
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Overlay para fechar ao clicar fora */}
      {showDetails && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
        />
      )}
    </>
  )
}

export default PendingSalesIndicator