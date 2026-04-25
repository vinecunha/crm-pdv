import React, { useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle, XCircle, ChevronUp, ChevronDown } from '@lib/icons'
import useOfflineSync from '@hooks/utils/useOfflineSync'
import { formatCurrency } from '@utils/formatters'
import { getOfflineSales } from '@utils/offlineStorage'

const SyncStatus = () => {
  const { pendingCount, isSyncing, lastSync, syncNow } = useOfflineSync()
  const [expanded, setExpanded] = useState(false)
  const [offlineSales, setOfflineSales] = useState([])
  
  const loadOfflineSales = async () => {
    const sales = await getOfflineSales()
    setOfflineSales(sales.filter(s => s.offlineCreated))
  }
  
  const handleExpand = () => {
    if (!expanded) {
      loadOfflineSales()
    }
    setExpanded(!expanded)
  }
  
  if (pendingCount === 0 && !expanded) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {expanded && (
        <div className="mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 w-80 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center justify-between">
              <span>Vendas Offline</span>
              <button
                onClick={syncNow}
                disabled={isSyncing}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
              >
                {isSyncing ? 'Sincronizando...' : 'Sincronizar agora'}
              </button>
            </h3>
          </div>
          
          <div className="max-h-64 overflow-y-auto p-2 space-y-2">
            {offlineSales.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                Nenhuma venda offline pendente
              </p>
            ) : (
              offlineSales.map((sale, index) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-900 rounded text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {sale.customer_name || 'Cliente não identificado'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(sale.offlineCreatedAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {formatCurrency(sale.final_amount)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {sale.items?.length || 0} itens
                    </span>
                    {sale.syncAttempts > 0 && (
                      <span className="text-xs text-yellow-600 dark:text-yellow-400">
                        Tentativas: {sale.syncAttempts}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {lastSync && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Última sinc: {lastSync.timestamp.toLocaleTimeString()}
              {lastSync.synced > 0 && (
                <span className="ml-2 text-green-600">✓ {lastSync.synced}</span>
              )}
              {lastSync.failed > 0 && (
                <span className="ml-2 text-red-600">✗ {lastSync.failed}</span>
              )}
            </div>
          )}
        </div>
      )}
      
      <button
        onClick={handleExpand}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium
          transition-all duration-200
          ${isSyncing 
            ? 'bg-blue-500 text-white animate-pulse' 
            : 'bg-yellow-500 dark:bg-yellow-600 text-white hover:bg-yellow-600 dark:hover:bg-yellow-700'
          }
        `}
      >
        {isSyncing ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Sincronizando...
          </>
        ) : (
          <>
            <WifiOff size={14} />
            {pendingCount} offline
          </>
        )}
        {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
    </div>
  )
}

export default SyncStatus
