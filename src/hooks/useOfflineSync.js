import { useState, useEffect } from 'react'
import { getOfflineSales, removeOfflineSale, updateOfflineSaleStatus } from '../utils/offlineStorage'

const useOfflineSync = () => {
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  
  const updatePendingCount = async () => {
    try {
      const sales = await getOfflineSales()
      const pending = sales.filter(s => s.status === 'pending' || s.offlineCreated)
      setPendingCount(pending.length)
    } catch (error) {
      console.error('Erro ao contar vendas offline:', error)
    }
  }
  
  const syncNow = async () => {
    if (isSyncing) return
    
    setIsSyncing(true)
    try {
      const sales = await getOfflineSales()
      const pending = sales.filter(s => s.status === 'pending' || s.offlineCreated)
      
      let synced = 0
      let failed = 0
      
      for (const sale of pending) {
        try {
          // Tentar sincronizar com o servidor
          const response = await fetch('/api/sales/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sale)
          })
          
          if (response.ok) {
            await removeOfflineSale(sale.id)
            synced++
          } else {
            await updateOfflineSaleStatus(sale.id, { syncAttempts: (sale.syncAttempts || 0) + 1 })
            failed++
          }
        } catch (error) {
          console.error(`Erro ao sincronizar venda ${sale.id}:`, error)
          failed++
        }
      }
      
      setLastSync({ timestamp: new Date(), synced, failed })
      await updatePendingCount()
      
    } finally {
      setIsSyncing(false)
    }
  }
  
  useEffect(() => {
    updatePendingCount()
    
    // Verificar a cada 30 segundos
    const interval = setInterval(updatePendingCount, 30000)
    return () => clearInterval(interval)
  }, [])
  
  // Sincronizar quando online
  useEffect(() => {
    const handleOnline = () => {
      syncNow()
    }
    
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [])
  
  return {
    pendingCount,
    isSyncing,
    lastSync,
    syncNow,
    updatePendingCount
  }
}

export default useOfflineSync