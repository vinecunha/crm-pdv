import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@contexts/AuthContext'
import { supabase } from '@lib/supabase'
import { 
  getOfflineSales,
  removeOfflineSale, 
  updateOfflineSaleStatus,
  clearSyncedSales
} from '@utils/offlineStorage'
import { logger } from '@utils/logger'

interface OfflineSaleItem {
  product_id: number
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
  total_price: number
}

interface OfflineSale {
  id: string
  customer_id: number | null
  customer_name: string
  customer_phone: string | null
  total_amount: number
  discount_amount: number
  discount_percent: number
  coupon_code: string | null
  final_amount: number
  payment_method: string
  payment_status: string
  status: string
  created_by: string | null
  items: OfflineSaleItem[]
  synced?: boolean
  retryCount?: number
  lastSyncError?: string
  lastSyncAttempt?: string
  syncError?: string
}

interface SyncResult {
  success: boolean
  data?: unknown
  error?: string
}

interface SyncProgress {
  current: number
  total: number
}

interface LastSync {
  timestamp: Date
  synced: number
  failed: number
}

interface UseOfflineSyncReturn {
  pendingCount: number
  isSyncing: boolean
  lastSync: LastSync | null
  syncProgress: SyncProgress | null
  syncNow: () => Promise<void>
  updatePendingCount: () => Promise<number>
  clearFailedSales: () => Promise<number>
}

const useOfflineSync = (): UseOfflineSyncReturn => {
  const { profile } = useAuth()
  const [pendingCount, setPendingCount] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState<boolean>(false)
  const [lastSync, setLastSync] = useState<LastSync | null>(null)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  
  const updatePendingCount = useCallback(async (): Promise<number> => {
    try {
      const sales = await getOfflineSales()
      const pending = sales.filter((s: OfflineSale) => !s.synced || s.status === 'pending')
      setPendingCount(pending.length)
      return pending.length
    } catch (error) {
      logger.error('Erro ao contar vendas offline:', error)
      return 0
    }
  }, [])
  
  const syncSingleSale = async (sale: OfflineSale): Promise<SyncResult> => {
    try {
      logger.log(`🔄 Sincronizando venda offline: ${sale.id}`, { 
        customer: sale.customer_name, 
        total: sale.final_amount 
      })
      
      const itemsJson = sale.items.map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }))
      
      const { data, error } = await supabase.rpc('create_sale_complete', {
        p_customer_id: sale.customer_id || null,
        p_customer_name: sale.customer_name || 'Cliente offline',
        p_customer_phone: sale.customer_phone || null,
        p_total_amount: sale.total_amount,
        p_discount_amount: sale.discount_amount || 0,
        p_discount_percent: sale.discount_percent || 0,
        p_coupon_code: sale.coupon_code || null,
        p_final_amount: sale.final_amount,
        p_payment_method: sale.payment_method,
        p_payment_status: sale.payment_status || 'paid',
        p_status: sale.status === 'pending' ? 'completed' : sale.status,
        p_created_by: sale.created_by || profile?.id,
        p_items: itemsJson
      })
      
      if (error) {
        logger.error(`❌ Erro ao sincronizar venda ${sale.id}:`, error)
        throw error
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido na RPC')
      }
      
      logger.log(`✅ Venda ${sale.id} sincronizada com sucesso!`, { 
        sale_number: data.sale_number,
        duplicate_prevented: data.duplicate_prevented 
      })
      
      return { success: true, data }
      
    } catch (error) {
      logger.error(`❌ Falha ao sincronizar venda ${sale.id}:`, error)
      return { success: false, error: (error as Error).message }
    }
  }
  
  const syncNow = useCallback(async (): Promise<void> => {
    if (isSyncing) {
      logger.log('⏳ Sincronização já em andamento...')
      return
    }
    
    if (!navigator.onLine) {
      logger.log('📴 Offline - sincronização adiada')
      return
    }
    
    setIsSyncing(true)
    setSyncProgress({ current: 0, total: 0 })
    
    try {
      const sales = await getOfflineSales()
      const pending = sales.filter((s: OfflineSale) => !s.synced || s.status === 'pending')
      
      if (pending.length === 0) {
        logger.log('✅ Nenhuma venda pendente para sincronizar')
        setLastSync({ timestamp: new Date(), synced: 0, failed: 0 })
        return
      }
      
      logger.log(`🔄 Iniciando sincronização de ${pending.length} vendas offline`)
      setSyncProgress({ current: 0, total: pending.length })
      
      let synced = 0
      let failed = 0
      
      for (let i = 0; i < pending.length; i++) {
        const sale = pending[i]
        setSyncProgress({ current: i + 1, total: pending.length })
        
        if (!navigator.onLine) {
          logger.log('📴 Conexão perdida durante sincronização')
          break
        }
        
        const result = await syncSingleSale(sale)
        
        if (result.success) {
          await removeOfflineSale(sale.id)
          synced++
          logger.log(`✅ Venda ${sale.id} removida do armazenamento offline`)
        } else {
          const retryCount = (sale.retryCount || 0) + 1
          await updateOfflineSaleStatus(sale.id, { 
            retryCount,
            lastSyncError: result.error,
            lastSyncAttempt: new Date().toISOString()
          })
          
          if (retryCount >= 3) {
            await updateOfflineSaleStatus(sale.id, { 
              status: 'sync_failed',
              syncError: 'Múltiplas tentativas falharam'
            })
            logger.error(`❌ Venda ${sale.id} marcada como falha após ${retryCount} tentativas`)
          }
          
          failed++
        }
      }
      
      const syncResult: LastSync = { timestamp: new Date(), synced, failed }
      setLastSync(syncResult)
      
      await updatePendingCount()
      
      logger.log(`✅ Sincronização concluída: ${synced} sucesso, ${failed} falha`, syncResult)
      
      if (synced > 0) {
        window.dispatchEvent(new CustomEvent('offline-sales-synced', { 
          detail: { synced, failed } 
        }))
      }
      
    } catch (error) {
      logger.error('❌ Erro durante sincronização:', error)
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }, [isSyncing, profile?.id, updatePendingCount])
  
  const clearFailedSales = useCallback(async (): Promise<number> => {
    try {
      const sales = await getOfflineSales()
      const failed = sales.filter((s: OfflineSale) => s.status === 'sync_failed' || (s.retryCount || 0) >= 3)
      
      for (const sale of failed) {
        await removeOfflineSale(sale.id)
      }
      
      await updatePendingCount()
      logger.log(`🧹 Limpas ${failed.length} vendas com falha permanente`)
      
      return failed.length
    } catch (error) {
      logger.error('Erro ao limpar vendas falhas:', error)
      return 0
    }
  }, [updatePendingCount])
  
  useEffect(() => {
    updatePendingCount()
    
    const interval = setInterval(updatePendingCount, 30000)
    
    return () => clearInterval(interval)
  }, [updatePendingCount])
  
  useEffect(() => {
    const handleOnline = () => {
      logger.log('🌐 Conexão restaurada - iniciando sincronização')
      syncNow()
    }
    
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncNow])
  
  useEffect(() => {
    const handleSyncEvent = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_PENDING_SALES') {
        logger.log('📱 Evento de sync recebido do Service Worker')
        syncNow()
      }
    }
    
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handleSyncEvent)
    }
    
    return () => {
      if (navigator.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handleSyncEvent)
      }
    }
  }, [syncNow])
  
  useEffect(() => {
    if (navigator.onLine) {
      const timer = setTimeout(() => {
        syncNow()
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [])
  
  return {
    pendingCount,
    isSyncing,
    lastSync,
    syncProgress,
    syncNow,
    updatePendingCount,
    clearFailedSales
  }
}

export default useOfflineSync