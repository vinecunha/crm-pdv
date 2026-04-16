// src/components/sales/PendingSalesIndicator.jsx
import React, { useEffect, useState } from 'react'
import { CloudOff, RefreshCw } from '../../../lib/icons'
import { getPendingSalesCount } from '../../../utils/offlineStorage'
import { useNetworkStatus } from '../../../hooks/useNetworkStatus'

const PendingSalesIndicator = () => {
  const [pendingCount, setPendingCount] = useState(0)
  const { isOnline } = useNetworkStatus()

  useEffect(() => {
    const checkPending = async () => {
      const count = await getPendingSalesCount()
      setPendingCount(count)
    }
    
    checkPending()
    const interval = setInterval(checkPending, 10000)
    
    return () => clearInterval(interval)
  }, [])

  if (pendingCount === 0) return null

  return (
    <div className="fixed bottom-20 left-4 z-50">
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-full shadow-lg
        ${isOnline 
          ? 'bg-blue-500 dark:bg-blue-600' 
          : 'bg-orange-500 dark:bg-orange-600'
        } text-white
      `}>
        {isOnline ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <CloudOff size={16} />
        )}
        <span className="text-sm font-medium">
          {pendingCount} {pendingCount === 1 ? 'venda pendente' : 'vendas pendentes'}
        </span>
      </div>
    </div>
  )
}

export default PendingSalesIndicator